import { parseJsonObjectFromText } from "@/lib/parse-ai-json";
import { matchResponseSchema, type MatchResponse } from "@/lib/validations";

export type { MatchResponse };

/** Matching model: see getMatchModel() in lib/llm-chat.ts (Groq / Anthropic / OpenAI-compatible). */

export const MATCH_SYSTEM_PROMPT = `Assess the fit between an R&D project and a researcher profile. Return ONLY JSON:
{
  "score": <number 0-100>,
  "explanation": "<2-3 sentences in English: why this person is or is not a good fit>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "risks": ["<potential risk or gap>"],
  "dimensions": {
    "domain_fit": { "score": <0-100>, "rationale": "<short reason>" },
    "skills_fit": { "score": <0-100>, "rationale": "<short reason>" },
    "availability_fit": { "score": <0-100>, "rationale": "<short reason>" },
    "motivation_fit": { "score": <0-100>, "rationale": "<short reason>" }
  }
}

Scoring rules:
- 80-100: Very strong fit of skills and availability
- 60-79: Good fit with minor gaps
- 40-59: Partial fit, requires discussion
- 0-39: Weak fit

Important: PhD candidates without publications may still score 80+ if their practical skills fit the project. Do not discriminate against early-career researchers.`;

export function buildMatchUserPrompt(input: {
  industry: string;
  cel_rd: string;
  wymagane_kompetencje: string;
  zakres_projektu: string;
  timeline: string;
  stage: string;
  research_domain: string;
  research_subdomain: string;
  research_description: string;
  practical_skills: string;
  projects_summary: string;
  availability_hours: string;
  availability_modes: string;
  motivation: string;
}) {
  return `R&D PROJECT:
Industry: ${input.industry}
Objective: ${input.cel_rd}
Required skills: ${input.wymagane_kompetencje}
Scope: ${input.zakres_projektu}
Timeline: ${input.timeline}

RESEARCHER PROFILE:
Stage: ${input.stage}
Domain: ${input.research_domain} / ${input.research_subdomain}
Description: ${input.research_description}
Practical skills: ${input.practical_skills}
Projects: ${input.projects_summary}
Availability: ${input.availability_hours}h/week, modes: ${input.availability_modes}
Motivation: ${input.motivation}`;
}

export function parseMatchResponse(rawText: string): MatchResponse {
  const obj = parseJsonObjectFromText(rawText);
  const parsed = matchResponseSchema.safeParse(obj);
  if (!parsed.success) {
    throw new Error("Invalid matching response format.");
  }
  return parsed.data;
}
