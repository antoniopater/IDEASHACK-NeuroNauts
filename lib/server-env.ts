import { NextResponse } from "next/server";
import { isLocalJsonDb } from "@/lib/db-mode";
import { hasLlmConfigured } from "@/lib/llm-chat";

export const LLM_KEY_MISSING_MESSAGE =
  "Brak konfiguracji modelu AI. Ustaw w .env.local np. GROQ_API_KEY (darmowy limit: https://console.groq.com) lub ANTHROPIC_API_KEY, albo OPENAI_BASE_URL + OPENAI_API_KEY + OPENAI_MODEL.";

/** @deprecated użyj LLM_KEY_MISSING_MESSAGE */
export const ANTHROPIC_KEY_MISSING_MESSAGE = LLM_KEY_MISSING_MESSAGE;

export function jsonMissingLlmKey(): NextResponse {
  return NextResponse.json({ error: LLM_KEY_MISSING_MESSAGE }, { status: 500 });
}

/** @deprecated użyj jsonMissingLlmKey */
export function jsonMissingAnthropicKey(): NextResponse {
  return jsonMissingLlmKey();
}

export { hasLlmConfigured };

/** @deprecated użyj hasLlmConfigured */
export function hasAnthropicApiKey(): boolean {
  return hasLlmConfigured();
}

export const SUPABASE_SERVICE_MISSING_MESSAGE =
  "Brak konfiguracji Supabase. Ustaw SUPABASE_SERVICE_ROLE_KEY oraz NEXT_PUBLIC_SUPABASE_URL w .env.local.";

export const SUPABASE_PUBLIC_MISSING_MESSAGE =
  "Brak NEXT_PUBLIC_SUPABASE_URL lub NEXT_PUBLIC_SUPABASE_ANON_KEY w .env.local.";

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

/** Zwraca komunikat dla klienta przy błędzie Supabase (np. sieć, RLS). */
export function supabaseErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return `Błąd połączenia z bazą: ${(err as { message: string }).message}`;
  }
  return "Nie udało się połączyć z bazą danych (Supabase). Sprawdź sieć i konfigurację.";
}
