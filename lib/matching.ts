import { parseJsonObjectFromText } from "@/lib/parse-ai-json";
import { matchResponseSchema, type MatchResponse } from "@/lib/validations";

export type { MatchResponse };

/** Model do dopasowania: patrz getMatchModel() w lib/llm-chat.ts (Groq / Anthropic / OpenAI-compatible). */

export const MATCH_SYSTEM_PROMPT = `Oceniasz dopasowanie między projektem R&D a profilem badacza. Zwróć TYLKO JSON:
{
  "score": <liczba 0-100>,
  "explanation": "<2-3 zdania po polsku: dlaczego ta osoba pasuje lub nie pasuje>",
  "strengths": ["<mocna strona 1>", "<mocna strona 2>"],
  "risks": ["<potencjalne ryzyko lub luka>"],
  "dimensions": {
    "domain_fit": { "score": <0-100>, "rationale": "<krótki powód>" },
    "skills_fit": { "score": <0-100>, "rationale": "<krótki powód>" },
    "availability_fit": { "score": <0-100>, "rationale": "<krótki powód>" },
    "motivation_fit": { "score": <0-100>, "rationale": "<krótki powód>" }
  }
}

Zasady oceny:
- 80-100: Bardzo dobre dopasowanie kompetencji i dostępności
- 60-79: Dobre dopasowanie z drobnymi lukami
- 40-59: Częściowe dopasowanie, wymaga rozmowy
- 0-39: Słabe dopasowanie

Ważne: doktoranci bez publikacji mogą mieć score 80+, jeśli ich umiejętności praktyczne pasują do projektu. Nie dyskryminuj wczesnego etapu kariery.`;

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
  return `PROJEKT R&D:
Branża: ${input.industry}
Cel: ${input.cel_rd}
Wymagane kompetencje: ${input.wymagane_kompetencje}
Zakres: ${input.zakres_projektu}
Horyzont: ${input.timeline}

PROFIL BADACZA:
Etap: ${input.stage}
Dziedzina: ${input.research_domain} / ${input.research_subdomain}
Opis: ${input.research_description}
Umiejętności praktyczne: ${input.practical_skills}
Projekty: ${input.projects_summary}
Dostępność: ${input.availability_hours}h/tydzień, tryby: ${input.availability_modes}
Motywacja: ${input.motivation}`;
}

export function parseMatchResponse(rawText: string): MatchResponse {
  const obj = parseJsonObjectFromText(rawText);
  const parsed = matchResponseSchema.safeParse(obj);
  if (!parsed.success) {
    throw new Error("Nieprawidłowy format odpowiedzi dopasowania.");
  }
  return parsed.data;
}
