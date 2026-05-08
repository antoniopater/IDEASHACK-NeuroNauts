import Anthropic from "@anthropic-ai/sdk";

export type LlmBackend = "anthropic" | "groq" | "openai_compatible";
type RetryableHttpStatus = 408 | 409 | 425 | 429 | 500 | 502 | 503 | 504;

const anthropicClientSingleton =
  process.env.ANTHROPIC_API_KEY?.trim() && new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000;
const DEFAULT_RETRIES = 1;

type CachedCompletion = {
  value: string;
  expiresAt: number;
};

const completionCache = new Map<string, CachedCompletion>();

function openAiTrioOk(): boolean {
  return Boolean(
    process.env.OPENAI_API_KEY?.trim() &&
      process.env.OPENAI_BASE_URL?.trim() &&
      process.env.OPENAI_MODEL?.trim()
  );
}

/** Which backend is active (null = no keys). */
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
  // Auto: Groq first (often free), then Anthropic (backward compatibility), then OpenAI-compatible.
  if (process.env.GROQ_API_KEY?.trim()) return "groq";
  if (process.env.ANTHROPIC_API_KEY?.trim()) return "anthropic";
  if (openAiTrioOk()) return "openai_compatible";
  return null;
}

export function hasLlmConfigured(): boolean {
  return resolveLlmBackend() !== null;
}

/** Model used for brief generation. */
export function getBriefModel(): string {
  const b = resolveLlmBackend();
  const override = process.env.LLM_BRIEF_MODEL?.trim();
  if (override) return override;
  if (b === "groq") return process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
  if (b === "openai_compatible") return process.env.OPENAI_MODEL!.trim();
  return process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";
}

/** Model used for application matching (can be lighter). */
export function getMatchModel(): string {
  return process.env.LLM_MATCH_MODEL?.trim() || getBriefModel();
}

async function anthropicComplete(params: {
  system: string;
  user: string;
  maxTokens: number;
  model: string;
  timeoutMs: number;
}): Promise<string> {
  if (!anthropicClientSingleton) {
    throw new Error("Anthropic client is not configured.");
  }
  const message = await withTimeout(
    anthropicClientSingleton.messages.create({
      model: params.model,
      max_tokens: params.maxTokens,
      system: params.system,
      messages: [{ role: "user", content: params.user }],
    }),
    params.timeoutMs
  );
  const block = message.content.find((x) => x.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Model did not return text content.");
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
  timeoutMs: number;
}): Promise<string> {
  const url = `${opts.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("LLM timeout"), opts.timeoutMs);
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
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
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
    throw new Error("Invalid JSON response from model API.");
  }
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Empty model response.");
  }
  return content;
}

export type CompleteChatPurpose = "brief" | "match" | "profile" | "ping";

/**
 * Single path for brief generation, matching, and health checks.
 * Backend chosen by AI_PROVIDER / auto order (see resolveLlmBackend).
 */
export async function completeChat(params: {
  system: string;
  user: string;
  maxTokens: number;
  purpose?: CompleteChatPurpose;
  timeoutMs?: number;
  retries?: number;
  cacheTtlMs?: number;
}): Promise<string> {
  const backend = resolveLlmBackend();
  if (!backend) {
    throw new Error("LLM_NOT_CONFIGURED");
  }
  const timeoutMs =
    params.timeoutMs ?? parsePositiveInt(process.env.LLM_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  const retries = params.retries ?? parsePositiveInt(process.env.LLM_RETRIES, DEFAULT_RETRIES);
  const cacheTtlMs =
    params.cacheTtlMs ?? parsePositiveInt(process.env.LLM_CACHE_TTL_MS, DEFAULT_CACHE_TTL_MS);
  const model = params.purpose === "match" ? getMatchModel() : getBriefModel();
  const cacheKey = buildCacheKey({
    backend,
    model,
    purpose: params.purpose ?? "brief",
    system: params.system,
    user: params.user,
    maxTokens: params.maxTokens,
  });
  const cached = completionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  if (cached && cached.expiresAt <= Date.now()) {
    completionCache.delete(cacheKey);
  }
  const runOnce = async (): Promise<string> => {
    switch (backend) {
      case "anthropic":
        return anthropicComplete({
          system: params.system,
          user: params.user,
          maxTokens: params.maxTokens,
          model,
          timeoutMs,
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
          timeoutMs,
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
          timeoutMs,
        });
      }
      default:
        throw new Error("Unsupported LLM backend.");
    }
  };
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const result = await runOnce();
      completionCache.set(cacheKey, {
        value: result,
        expiresAt: Date.now() + Math.max(0, cacheTtlMs),
      });
      return result;
    } catch (err) {
      if (attempt >= retries || !isRetryableLlmError(err)) {
        throw err;
      }
    }
  }
  throw new Error("Failed to obtain model response.");
}

export function llmErrorToUserMessage(err: unknown, context: "brief" | "match" = "brief"): string {
  if (err instanceof Error && err.message === "LLM_NOT_CONFIGURED") {
    return "AI model is not configured. Add GROQ_API_KEY (for example, free tier at console.groq.com) or ANTHROPIC_API_KEY, or OPENAI_BASE_URL + OPENAI_API_KEY + OPENAI_MODEL.";
  }
  if (err && typeof err === "object" && "status" in err) {
    const s = (err as { status?: number }).status;
    if (s === 429) return "Model API rate limit exceeded. Please try again shortly.";
    if (s === 401 || s === 403) {
      return context === "match"
        ? "Model API authorization error - check key (GROQ_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY) in .env.local."
        : "Model API authorization error - check key in .env.local.";
    }
  }
  if (err instanceof Error && /apiKey|API key|401/i.test(err.message)) {
    return "Missing or invalid model API key.";
  }
  if (err instanceof Error && /timeout/i.test(err.message)) {
    return "AI model timed out. Please try again shortly.";
  }
  return "Error while communicating with the AI model. Please try again later.";
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error(`LLM timeout after ${timeoutMs}ms`);
      (err as Error & { status?: number }).status = 504;
      reject(err);
    }, timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function buildCacheKey(params: {
  backend: LlmBackend;
  model: string;
  purpose: CompleteChatPurpose;
  system: string;
  user: string;
  maxTokens: number;
}): string {
  return [
    params.backend,
    params.model,
    params.purpose,
    String(params.maxTokens),
    params.system.trim(),
    params.user.trim(),
  ].join("::");
}

function isRetryableLlmError(err: unknown): boolean {
  const retryableStatuses: RetryableHttpStatus[] = [408, 409, 425, 429, 500, 502, 503, 504];
  if (err && typeof err === "object" && "status" in err) {
    const status = Number((err as { status?: number }).status);
    return retryableStatuses.includes(status as RetryableHttpStatus);
  }
  if (err instanceof Error) {
    return /timeout|network|fetch failed|socket|temporar/i.test(err.message);
  }
  return false;
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) return fallback;
  const parsed = Number(raw.trim());
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}
