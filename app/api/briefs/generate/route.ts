import { NextResponse } from "next/server";
import {
  aiBriefResponseSchema,
  generateBriefInputSchema,
  type AiBriefContent,
} from "@/lib/brief-schema";
import { completeChat, llmErrorToUserMessage } from "@/lib/llm-chat";
import { parseJsonObjectFromText } from "@/lib/parse-ai-json";
import { hasLlmConfigured, jsonMissingLlmKey } from "@/lib/server-env";

const SYSTEM_PROMPT = `Jesteś ekspertem ds. R&D i transferu technologii. Pomagasz firmom przekształcić ogólny problem biznesowy w precyzyjny brief R&D, który zrozumie doktorant lub młody badacz.

Generujesz brief w języku polskim. Brief musi być:
- Konkretny i mierzalny (nie "zbadaj temat X", ale "dostarcz analizę Y z rekomendacjami dla Z")
- Zrozumiały dla badacza bez znajomości firmy
- Realistyczny dla małego projektu (konsultacja, POC, analiza)

Zwróć TYLKO JSON w tym formacie (bez markdown, bez komentarzy):
{
  "cel_rd": "Jeden akapit opisujący cel projektu z perspektywy badawczej",
  "wymagane_kompetencje": ["kompetencja 1", "kompetencja 2", "kompetencja 3"],
  "zakres_projektu": "Opis zakresu: co wchodzi w projekt, a co nie",
  "oczekiwany_rezultat": "Co konkretnie firma otrzyma na końcu",
  "pierwszy_milestone": "Co powinno być gotowe po pierwszych 2 tygodniach współpracy",
  "suggested_researcher_profile": "Krótki opis idealnego kandydata (3 zdania)"
}`;

function buildUserPrompt(input: {
  industry: string;
  problem: string;
  timeline: string;
  budget: string;
  expected_result: string;
}) {
  return `Firma z branży: ${input.industry}
Problem: ${input.problem}
Horyzont: ${input.timeline}
Budżet: ${input.budget}
Oczekiwany rezultat: ${input.expected_result || "—"}`;
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe ciało żądania JSON." }, { status: 400 });
  }

  const parsed = generateBriefInputSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" ");
    return NextResponse.json({ error: msg || "Walidacja nie powiodła się." }, { status: 400 });
  }

  if (!hasLlmConfigured()) {
    return jsonMissingLlmKey();
  }

  const input = parsed.data;

  try {
    const text = await completeChat({
      purpose: "brief",
      system: SYSTEM_PROMPT,
      user: buildUserPrompt({
        industry: input.industry,
        problem: input.problem,
        timeline: input.timeline,
        budget: input.budget,
        expected_result: input.expected_result ?? "",
      }),
      maxTokens: 4096,
    });

    let brief: AiBriefContent;
    try {
      const rawObj = parseJsonObjectFromText(text);
      const validated = aiBriefResponseSchema.safeParse(rawObj);
      if (!validated.success) {
        return NextResponse.json(
          {
            error:
              "Odpowiedź AI ma nieprawidłowy format JSON. Spróbuj ponownie wygenerować brief.",
          },
          { status: 400 }
        );
      }
      brief = validated.data;
    } catch {
      return NextResponse.json(
        {
          error:
            "Nie udało się sparsować odpowiedzi AI jako JSON. Spróbuj wygenerować brief ponownie.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ brief });
  } catch (e) {
    const msg = llmErrorToUserMessage(e, "brief");
    const status = msg.includes("limit") ? 429 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
