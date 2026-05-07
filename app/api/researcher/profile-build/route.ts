import { NextResponse } from "next/server";
import { completeChat, llmErrorToUserMessage } from "@/lib/llm-chat";
import {
  buildProfileBuilderUserPrompt,
  parseProfileBuilderResponse,
  PROFILE_BUILDER_SYSTEM_PROMPT,
} from "@/lib/profile-builder";
import { hasLlmConfigured, jsonMissingLlmKey } from "@/lib/server-env";
import { profileBuilderInputSchema } from "@/lib/validations";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const parsed = profileBuilderInputSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" ");
    return NextResponse.json({ error: msg || "Validation failed." }, { status: 400 });
  }

  if (!hasLlmConfigured()) {
    return jsonMissingLlmKey();
  }

  try {
    const text = await completeChat({
      purpose: "profile",
      system: PROFILE_BUILDER_SYSTEM_PROMPT,
      user: buildProfileBuilderUserPrompt(parsed.data),
      maxTokens: 1800,
    });
    return NextResponse.json({ profile: parseProfileBuilderResponse(text) });
  } catch (err) {
    const status =
      err instanceof Error && err.message.includes("Invalid format") ? 502 : 500;
    return NextResponse.json(
      { error: llmErrorToUserMessage(err, "brief") },
      { status }
    );
  }
}
