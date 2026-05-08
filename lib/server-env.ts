import { NextResponse } from "next/server";
import { isLocalJsonDb } from "@/lib/db-mode";
import { hasLlmConfigured } from "@/lib/llm-chat";

export const LLM_KEY_MISSING_MESSAGE =
  "AI model is not configured. Set GROQ_API_KEY (for example, free tier at https://console.groq.com) or ANTHROPIC_API_KEY, or OPENAI_BASE_URL + OPENAI_API_KEY + OPENAI_MODEL in .env.local.";

/** @deprecated use LLM_KEY_MISSING_MESSAGE */
export const ANTHROPIC_KEY_MISSING_MESSAGE = LLM_KEY_MISSING_MESSAGE;

export function jsonMissingLlmKey(): NextResponse {
  return NextResponse.json({ error: LLM_KEY_MISSING_MESSAGE }, { status: 500 });
}

/** @deprecated use jsonMissingLlmKey */
export function jsonMissingAnthropicKey(): NextResponse {
  return jsonMissingLlmKey();
}

export { hasLlmConfigured };

/** @deprecated use hasLlmConfigured */
export function hasAnthropicApiKey(): boolean {
  return hasLlmConfigured();
}

export const SUPABASE_SERVICE_MISSING_MESSAGE =
  "Supabase is not configured. Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local.";

export const SUPABASE_PUBLIC_MISSING_MESSAGE =
  "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.";

export function hasSupabaseServiceConfig(): boolean {
  if (isLocalJsonDb()) return true;
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

export function hasSupabasePublicConfig(): boolean {
  if (isLocalJsonDb()) return true;
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

/** Returns a client-facing message for Supabase errors (for example network or RLS). */
export function supabaseErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return `Database connection error: ${(err as { message: string }).message}`;
  }
  return "Failed to connect to the database (Supabase). Check network and configuration.";
}
