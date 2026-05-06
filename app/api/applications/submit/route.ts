import { aiBriefResponseSchema, applicationSubmitSchema } from "@/lib/brief-schema";
import { dbGetBriefForSubmit, dbGetResearcherByEmailForSubmit, dbGetResearcherProjectsForSubmit, dbInsertApplication } from "@/lib/app-db";
import { completeChat, llmErrorToUserMessage } from "@/lib/llm-chat";
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

function matchLlmErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.includes("Nieprawidłowy format")) {
    return "Nie udało się odczytać odpowiedzi dopasowania AI. Spróbuj ponownie.";
  }
  return llmErrorToUserMessage(err, "match");
}

export async function POST(req: Request) {
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

  const { briefId, researcherEmail, coverMessage } = parsed.data;
  const email = researcherEmail.trim().toLowerCase();

  if (!hasSupabaseServiceConfig()) {
    return NextResponse.json({ error: SUPABASE_SERVICE_MISSING_MESSAGE }, { status: 500 });
  }

  const researcher = await dbGetResearcherByEmailForSubmit(email);
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
  const raw = (brief.raw_input ?? {}) as { industry?: string; timeline?: string };

  const projects = await dbGetResearcherProjectsForSubmit(researcher.id);

  const projects_summary =
    projects && projects.length > 0
      ? projects
          .map((p) => {
            const years =
              p.year_from || p.year_to
                ? ` (${[p.year_from, p.year_to].filter(Boolean).join("–")})`
                : "";
            const desc = p.description ? `: ${p.description}` : "";
            return `${p.title}${years}${desc}`;
          })
          .join(" | ")
      : "Brak zapisanych projektów.";

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

  const inserted = await dbInsertApplication({
    briefId,
    researcherId: researcher.id,
    coverMessage: coverMessage.trim(),
    match_score: match.score,
    match_explanation: match.explanation,
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
    matchScore: match.score,
    matchExplanation: match.explanation,
    strengths: match.strengths,
    risks: match.risks,
    dimensions: match.dimensions ?? null,
  });
}
