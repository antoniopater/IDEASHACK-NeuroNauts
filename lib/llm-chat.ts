import Anthropic from "@anthropic-ai/sdk";

export type LlmBackend = "anthropic" | "groq" | "openai_compatible";

const anthropicClientSingleton =
  process.env.ANTHROPIC_API_KEY?.trim() && new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function openAiTrioOk(): boolean {
  return Boolean(
    process.env.OPENAI_API_KEY?.trim() &&
      process.env.OPENAI_BASE_URL?.trim() &&
      process.env.OPENAI_MODEL?.trim()
  );
}

/** Który backend jest aktywny (null = brak kluczy). */
export function resolveLlmBackend(): LlmBackend | null {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === "anthropic") {
    return process.env.ANTHROPIC_API_KEY?.trim() ? "anthropic" : null;
  }
  if (explicit === "groq") {
    return process.env.GROQ_API_KEY?.trim() ? "groq" : null;
  }
  if (explicit === "openai_compatible") {
    return openAiTrioOk() ? "openai_compatible" : null;
  }
  // Auto: najpierw Groq (często darmowy), potem Anthropic (kompatybilność wsteczna), potem OpenAI-compatible.
  if (process.env.GROQ_API_KEY?.trim()) return "groq";
  if (process.env.ANTHROPIC_API_KEY?.trim()) return "anthropic";
  if (openAiTrioOk()) return "openai_compatible";
  return null;
}

export function hasLlmConfigured(): boolean {
  return resolveLlmBackend() !== null;
}

/** Model do generowania briefu. */
export function getBriefModel(): string {
  const b = resolveLlmBackend();
  const override = process.env.LLM_BRIEF_MODEL?.trim();
  if (override) return override;
  if (b === "groq") return process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
  if (b === "openai_compatible") return process.env.OPENAI_MODEL!.trim();
  return process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";
}

/** Model do dopasowania przy aplikacji (może być lżejszy). */
export function getMatchModel(): string {
  return process.env.LLM_MATCH_MODEL?.trim() || getBriefModel();
}

async function anthropicComplete(params: {
  system: string;
  user: string;
  maxTokens: number;
  model: string;
}): Promise<string> {
  if (!anthropicClientSingleton) {
    throw new Error("Brak skonfigurowanego klienta Anthropic.");
  }
  const message = await anthropicClientSingleton.messages.create({
    model: params.model,
    max_tokens: params.maxTokens,
    system: params.system,
    messages: [{ role: "user", content: params.user }],
  });
  const block = message.content.find((x) => x.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Model nie zwrócił treści tekstowej.");
  }
  return block.text;
}

async function openAiCompatibleComplete(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxTokens: number;
}): Promise<string> {
  const url = `${opts.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });
  const rawText = await res.text();
  if (!res.ok) {
    const err = new Error(`LLM HTTP ${res.status}: ${rawText.slice(0, 400)}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  let data: { choices?: { message?: { content?: string | null } }[] };
  try {
    data = JSON.parse(rawText) as typeof data;
  } catch {
    throw new Error("Nieprawidłowa odpowiedź JSON z API modelu.");
  }
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Pusta odpowiedź modelu.");
  }
  return content;
}

export type CompleteChatPurpose = "brief" | "match" | "profile" | "ping";

/**
 * Jedna ścieżka dla generowania briefu, dopasowania i healthchecku.
 * Backend wybierany przez AI_PROVIDER / kolejność auto (patrz resolveLlmBackend).
 */
export async function completeChat(params: {
  system: string;
  user: string;
  maxTokens: number;
  purpose?: CompleteChatPurpose;
}): Promise<string> {
  const backend = resolveLlmBackend();
  if (!backend) {
    throw new Error("LLM_NOT_CONFIGURED");
  }
  const model = params.purpose === "match" ? getMatchModel() : getBriefModel();

  switch (backend) {
    case "anthropic":
      return anthropicComplete({
        system: params.system,
        user: params.user,
        maxTokens: params.maxTokens,
        model,
      });
    case "groq": {
      const key = process.env.GROQ_API_KEY!.trim();
      return openAiCompatibleComplete({
        baseUrl: "https://api.groq.com/openai/v1",
        apiKey: key,
        model,
        system: params.system,
        user: params.user,
        maxTokens: params.maxTokens,
      });
    }
    case "openai_compatible": {
      return openAiCompatibleComplete({
        baseUrl: process.env.OPENAI_BASE_URL!.trim(),
        apiKey: process.env.OPENAI_API_KEY!.trim(),
        model,
        system: params.system,
        user: params.user,
        maxTokens: params.maxTokens,
      });
    }
    default:
      throw new Error("Nieobsługiwany backend LLM.");
  }
}

export function llmErrorToUserMessage(err: unknown, context: "brief" | "match" = "brief"): string {
  if (err instanceof Error && err.message === "LLM_NOT_CONFIGURED") {
    return "Brak konfiguracji modelu AI. Dodaj GROQ_API_KEY (np. darmowy limit na console.groq.com) lub ANTHROPIC_API_KEY, albo OPENAI_BASE_URL + OPENAI_API_KEY + OPENAI_MODEL.";
  }
  if (err && typeof err === "object" && "status" in err) {
    const s = (err as { status?: number }).status;
    if (s === 429) return "Przekroczono limit zapytań do API modelu. Spróbuj za chwilę.";
    if (s === 401 || s === 403) {
      return context === "match"
        ? "Błąd autoryzacji API modelu — sprawdź klucz (GROQ_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY) w .env.local."
        : "Błąd autoryzacji API modelu — sprawdź klucz w .env.local.";
    }
  }
  if (err instanceof Error && /apiKey|API key|401/i.test(err.message)) {
    return "Brak lub nieprawidłowy klucz API modelu.";
  }
  return "Błąd podczas komunikacji z modelem AI. Spróbuj ponownie później.";
}
