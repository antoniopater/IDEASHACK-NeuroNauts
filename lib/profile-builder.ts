import { parseJsonObjectFromText } from "@/lib/parse-ai-json";
import {
  profileBuilderResponseSchema,
  type ProfileBuilderResponse,
} from "@/lib/validations";

export const PROFILE_BUILDER_SYSTEM_PROMPT = `You help a PhD candidate or PhD graduate describe a profile for companies seeking R&D collaboration.
Return ONLY JSON matching this schema:
{
  "research_subdomain": "<short subdiscipline or specialization area>",
  "research_description": "<80-4000 characters, in English, understandable for a company>",
  "practical_skills": ["<3-12 specific practical skills>"],
  "projects": [
    {
      "title": "<project title>",
      "description": "<what was done and what was the outcome>",
      "type": "research|industry|internship|consultation|student_circle|other",
      "year_from": 2023,
      "year_to": 2024
    }
  ],
  "motivation": "<100-600 characters: why this person wants to collaborate with companies>",
  "publication_links": ["<URL>"]
}

Rules:
- Do not invent publications, years, or institutions. If data is missing, omit optional fields.
- Translate academic language into practical competencies.
- Do not promise implementations or certifications not present in the source text.
- A PhD candidate without publications can still have a strong profile if they have projects and skills.`;

export function buildProfileBuilderUserPrompt(input: {
  rawText: string;
  stage?: string;
  research_domain?: string;
  publication_links?: string[];
}): string {
  return `PROFILE CONTEXT:
Career stage: ${input.stage ?? "—"}
Domain: ${input.research_domain ?? "—"}
Publication links provided by the user: ${(input.publication_links ?? []).join(", ") || "—"}

RAW DESCRIPTION / CV / NOTES:
${input.rawText}`;
}

export function parseProfileBuilderResponse(rawText: string): ProfileBuilderResponse {
  const obj = parseJsonObjectFromText(rawText);
  const parsed = profileBuilderResponseSchema.safeParse(obj);
  if (!parsed.success) {
    throw new Error("Invalid AI Profile Builder response format.");
  }
  return parsed.data;
}
