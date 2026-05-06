import { parseJsonObjectFromText } from "@/lib/parse-ai-json";
import {
  profileBuilderResponseSchema,
  type ProfileBuilderResponse,
} from "@/lib/validations";

export const PROFILE_BUILDER_SYSTEM_PROMPT = `Pomagasz doktorantowi lub doktorowi opisać profil dla firm szukających współpracy R&D.
Zwróć TYLKO JSON zgodny ze schematem:
{
  "research_subdomain": "<krótka subdyscyplina lub obszar specjalizacji>",
  "research_description": "<80-4000 znaków, po polsku, zrozumiale dla firmy>",
  "practical_skills": ["<3-12 konkretnych umiejętności praktycznych>"],
  "projects": [
    {
      "title": "<nazwa projektu>",
      "description": "<co zrobiono i jaki był rezultat>",
      "type": "research|industry|internship|consultation|student_circle|other",
      "year_from": 2023,
      "year_to": 2024
    }
  ],
  "motivation": "<100-600 znaków: dlaczego ta osoba chce współpracować z firmami>",
  "publication_links": ["<URL>"]
}

Zasady:
- Nie wymyślaj publikacji, lat ani instytucji. Jeśli nie ma danych, pomiń opcjonalne pola.
- Tłumacz język akademicki na praktyczne kompetencje.
- Nie obiecuj wdrożeń ani certyfikatów, których nie ma w tekście.
- Doktorant bez publikacji nadal może mieć silny profil, jeśli ma projekty i umiejętności.`;

export function buildProfileBuilderUserPrompt(input: {
  rawText: string;
  stage?: string;
  research_domain?: string;
  publication_links?: string[];
}): string {
  return `KONTEKST PROFILU:
Etap kariery: ${input.stage ?? "—"}
Dziedzina: ${input.research_domain ?? "—"}
Linki publikacji podane przez użytkownika: ${(input.publication_links ?? []).join(", ") || "—"}

SUROWY OPIS / CV / NOTATKI:
${input.rawText}`;
}

export function parseProfileBuilderResponse(rawText: string): ProfileBuilderResponse {
  const obj = parseJsonObjectFromText(rawText);
  const parsed = profileBuilderResponseSchema.safeParse(obj);
  if (!parsed.success) {
    throw new Error("Nieprawidłowy format odpowiedzi AI Profile Buildera.");
  }
  return parsed.data;
}
