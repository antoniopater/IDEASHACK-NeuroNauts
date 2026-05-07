import { aiBriefResponseSchema, applicationSubmitSchema } from "@/lib/brief-schema";
import { dbGetBriefForSubmit, dbGetResearcherProfile, dbGetResearcherProjectsForSubmit, dbInsertApplication } from "@/lib/app-db";
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
import { getCurrentUser } from "@/lib/auth-session";

function matchLlmErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.includes("Invalid format")) {
    return "Failed to parse the AI matching response. Please try again.";
  }
  return llmErrorToUserMessage(err, "match");
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in as a researcher." }, { status: 401 });
  }
  if (user.role !== "researcher") {
    return NextResponse.json({ error: "This account does not have researcher permissions." }, { status: 403 });
  }
  if (!user.researcher_id) {
    return NextResponse.json(
      { error: "Complete your researcher profile before applying to briefs." },
      { status: 403 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const parsed = applicationSubmitSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" ");
    return NextResponse.json({ error: msg || "Validation failed." }, { status: 400 });
  }

  const { briefId, coverMessage } = parsed.data;

  if (!hasSupabaseServiceConfig()) {
    return NextResponse.json({ error: SUPABASE_SERVICE_MISSING_MESSAGE }, { status: 500 });
  }

  const researcher = await dbGetResearcherProfile(user.researcher_id);
  if (!researcher) {
    return NextResponse.json(
      { error: "Profile not found. Register as a researcher first." },
      { status: 404 }
    );
  }

  const brief = await dbGetBriefForSubmit(briefId);
  if (!brief || brief.status !== "published") {
    return NextResponse.json({ error: "The brief does not exist or is not published." }, { status: 404 });
  }

  const finalParsed = aiBriefResponseSchema.safeParse(brief.final_content);
  if (!finalParsed.success) {
    return NextResponse.json({ error: "The brief content is invalid." }, { status: 502 });
  }
  const content = finalParsed.data;
  const raw = (brief.raw_input ?? {}) as { industry?: string; timeline?: string };

  const projects = await dbGetResearcherProjectsForSubmit(user.researcher_id);

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
      : "No saved projects.";

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
      return NextResponse.json({ error: "You have already submitted an application for this brief." }, { status: 409 });
    }
    return NextResponse.json(
      { error: inserted.message || "Failed to save application." },
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
