import { NextResponse } from "next/server";
import {
  aiBriefResponseSchema,
  generateBriefInputSchema,
  type AiBriefContent,
} from "@/lib/brief-schema";
import { completeChat, llmErrorToUserMessage } from "@/lib/llm-chat";
import { parseJsonObjectFromText } from "@/lib/parse-ai-json";
import { hasLlmConfigured, jsonMissingLlmKey } from "@/lib/server-env";

const SYSTEM_PROMPT = `You are an expert in R&D and technology transfer. You help companies turn a general business problem into a precise R&D brief understandable to a PhD candidate or early-career researcher.

Generate the brief in English. The brief must be:
- Specific and measurable (not "explore topic X", but "deliver analysis Y with recommendations for Z")
- Understandable for a researcher with no prior company context
- Realistic for a small project (consultation, POC, analysis)

Return ONLY JSON in this format (no markdown, no comments):
{
  "cel_rd": "One paragraph describing the project objective from a research perspective",
  "wymagane_kompetencje": ["competency 1", "competency 2", "competency 3"],
  "zakres_projektu": "Scope description: what is included in the project and what is out of scope",
  "oczekiwany_rezultat": "What exactly the company will receive at the end",
  "pierwszy_milestone": "What should be ready after the first 2 weeks of collaboration",
  "suggested_researcher_profile": "Brief description of the ideal candidate (3 sentences)"
}`;

function buildUserPrompt(input: {
  industry: string;
  problem: string;
  timeline: string;
  budget: string;
  expected_result: string;
}) {
  return `Company industry: ${input.industry}
Problem: ${input.problem}
Timeline: ${input.timeline}
Budget: ${input.budget}
Expected result: ${input.expected_result || "—"}`;
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const parsed = generateBriefInputSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" ");
    return NextResponse.json({ error: msg || "Validation failed." }, { status: 400 });
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
              "The AI response has an invalid JSON format. Please regenerate the brief.",
          },
          { status: 400 }
        );
      }
      brief = validated.data;
    } catch {
      return NextResponse.json(
        {
          error:
            "Failed to parse the AI response as JSON. Please regenerate the brief.",
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
