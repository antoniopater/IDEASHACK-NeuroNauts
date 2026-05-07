import { aiBriefResponseSchema, applicationSubmitSchema } from "@/lib/brief-schema";
import { dbGetBriefForSubmit, dbGetResearcherProfile, dbGetResearcherProjectsForSubmit, dbInsertApplication } from "@/lib/app-db";
import { completeChat, llmErrorToUserMessage } from "@/lib/llm-chat";
import {
  blendApplicationMatchScores,
  computePairSemanticScore,
} from "@/lib/embeddings";
import {
  MATCH_SYSTEM_PROMPT,
  buildMatchUserPrompt,
  parseMatchResponse,
} from "@/lib/matching";
import {
  hasLlmConfigured,
  hasSupabaseServiceConfig,
  jsonMissingLlmKey,
  SUPABASE_SERVICE_MISSING_MESSAGE,
} from "@/lib/server-env";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import {
  buildBriefEmbeddingText,
  buildProjectsSummaryLines,
  buildResearcherEmbeddingText,
} from "@/lib/match-text";

function matchLlmErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.includes("Nieprawidłowy format")) {
    return "Nie udało się odczytać odpowiedzi dopasowania AI. Spróbuj ponownie.";
  }
  return llmErrorToUserMessage(err, "match");
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Musisz byc zalogowany jako badacz." }, { status: 401 });
  }
  if (user.role !== "researcher") {
    return NextResponse.json({ error: "To konto nie ma uprawnien badacza." }, { status: 403 });
  }
  if (!user.researcher_id) {
    return NextResponse.json(
      { error: "Najpierw uzupelnij profil badacza, aby aplikowac na briefy." },
      { status: 403 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe ciało żądania JSON." }, { status: 400 });
  }

  const parsed = applicationSubmitSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" ");
    return NextResponse.json({ error: msg || "Walidacja nie powiodła się." }, { status: 400 });
  }

  const { briefId, coverMessage } = parsed.data;

  if (!hasSupabaseServiceConfig()) {
    return NextResponse.json({ error: SUPABASE_SERVICE_MISSING_MESSAGE }, { status: 500 });
  }

  const researcher = await dbGetResearcherProfile(user.researcher_id);
  if (!researcher) {
    return NextResponse.json(
      { error: "Nie znaleziono profilu. Najpierw zarejestruj się jako badacz." },
      { status: 404 }
    );
  }

  const brief = await dbGetBriefForSubmit(briefId);
  if (!brief || brief.status !== "published") {
    return NextResponse.json({ error: "Brief nie istnieje lub nie jest opublikowany." }, { status: 404 });
  }

  const finalParsed = aiBriefResponseSchema.safeParse(brief.final_content);
  if (!finalParsed.success) {
    return NextResponse.json({ error: "Brief ma nieprawidłową treść." }, { status: 502 });
  }
  const content = finalParsed.data;
  const raw = (brief.raw_input ?? {}) as {
    industry?: string;
    timeline?: string;
    budget?: string;
  };

  const projects = await dbGetResearcherProjectsForSubmit(user.researcher_id);

  const projects_summary = buildProjectsSummaryLines(projects);

  const skills =
    researcher.practical_skills?.length && researcher.practical_skills.length > 0
      ? researcher.practical_skills.join(", ")
      : "—";
  const modes =
    researcher.availability_modes?.length && researcher.availability_modes.length > 0
      ? researcher.availability_modes.join(", ")
      : "—";
  const hours =
    researcher.availability_hours_per_week != null
      ? String(researcher.availability_hours_per_week)
      : "—";

  const userPrompt = buildMatchUserPrompt({
    industry: raw.industry ?? "—",
    cel_rd: content.cel_rd,
    wymagane_kompetencje: content.wymagane_kompetencje.join(", "),
    zakres_projektu: content.zakres_projektu,
    timeline: raw.timeline ?? "—",
    stage: researcher.stage,
    research_domain: researcher.research_domain ?? "—",
    research_subdomain: researcher.research_subdomain ?? "—",
    research_description: researcher.research_description ?? "—",
    practical_skills: skills,
    projects_summary,
    availability_hours: hours,
    availability_modes: modes,
    motivation: researcher.motivation ?? "—",
  });

  if (!hasLlmConfigured()) {
    return jsonMissingLlmKey();
  }

  let match;
  try {
    const text = await completeChat({
      purpose: "match",
      system: MATCH_SYSTEM_PROMPT,
      user: userPrompt,
      maxTokens: 1024,
    });
    match = parseMatchResponse(text);
  } catch (e) {
    const msg = matchLlmErrorMessage(e);
    const status = msg.includes("limit") ? 429 : 502;
    return NextResponse.json({ error: msg }, { status });
  }

  let matchScore = match.score;
  let matchExplanation = match.explanation;
  const semanticScore = await computePairSemanticScore(
    buildResearcherEmbeddingText(
      {
        stage: researcher.stage,
        motivation: researcher.motivation,
        research_domain: researcher.research_domain,
        research_subdomain: researcher.research_subdomain,
        research_description: researcher.research_description,
        practical_skills: researcher.practical_skills,
        availability_hours_per_week: researcher.availability_hours_per_week,
        availability_modes: researcher.availability_modes,
      },
      projects_summary
    ),
    buildBriefEmbeddingText(content, {
      industry: raw.industry,
      timeline: raw.timeline,
      budget: raw.budget,
    })
  );
  if (semanticScore != null) {
    matchScore = blendApplicationMatchScores(match.score, semanticScore);
    matchExplanation = `${match.explanation.trim()} Dopasowanie semantyczne (embedding): ${semanticScore}/100 — łączone z oceną modelu językowego.`;
  }

  const inserted = await dbInsertApplication({
    briefId,
    researcherId: researcher.id,
    coverMessage: coverMessage.trim(),
    match_score: matchScore,
    match_explanation: matchExplanation,
    match_strengths: match.strengths,
    match_risks: match.risks,
    match_dimensions: match.dimensions ?? null,
  });

  if ("error" in inserted) {
    if (inserted.error.code === "23505") {
      return NextResponse.json({ error: "Już złożyłeś aplikację na ten brief." }, { status: 409 });
    }
    return NextResponse.json(
      { error: inserted.message || "Nie udało się zapisać aplikacji." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    applicationId: inserted.id,
    matchScore,
    matchExplanation: matchExplanation,
    strengths: match.strengths,
    risks: match.risks,
    dimensions: match.dimensions ?? null,
  });
}
