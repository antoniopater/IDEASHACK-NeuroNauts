import { createHash } from "crypto";
import { resolveLlmBackend, type LlmBackend } from "@/lib/llm-chat";

export type EmbeddingRoutingProvider = "groq" | "openai_compatible" | "voyage";

export type EmbeddingsEndpointConfig = {
  url: string;
  apiKey: string;
  model: string;
  /** Where this endpoint came from (diagnostics / future format quirks). */
  provider: EmbeddingRoutingProvider;
};

const CACHE_MAX = 500;
const EMBEDDING_TIMEOUT_MS = 22_000;
const GROQ_MODELS_ENDPOINT = "https://api.groq.com/openai/v1/models";
const GROQ_MODEL_LIST_CACHE_MS = 10 * 60 * 1000;

/**
 * Groq’s docs model list often omits embeddings; we resolve `id` from GET /openai/v1/models when it matches
 * /embed/, or honour GROQ_EMBEDDING_MODEL when that id appears on the list.
 */
export const GROQ_EMBED_MODEL_AUTO_SENTINEL = "__GROQ_EMBEDDING_MODEL_AUTO__";

export class GroqEmbeddingsUnavailableError extends Error {
  readonly code = "GROQ_NO_EMBEDDING_MODEL" as const;
  constructor(message: string) {
    super(message);
    this.name = "GroqEmbeddingsUnavailableError";
    Object.setPrototypeOf(this, GroqEmbeddingsUnavailableError.prototype);
  }
}

let loggedGroqEmbeddingsUnavailable = false;

/** Logs once when the Groq key has no embedding models available via discovery. */
export function logGroqEmbeddingsUnavailableOnce(message: string): void {
  if (loggedGroqEmbeddingsUnavailable) return;
  loggedGroqEmbeddingsUnavailable = true;
  console.warn(`[embeddings:Groq] ${message}`);
}

/** Test-only reset (module globals). */
export function resetGroqEmbeddingCachesForTests(): void {
  loggedGroqEmbeddingsUnavailable = false;
  groqModelListCache.clear();
  groqPickCache.clear();
}

const groqModelListCache = new Map<string, { ids: string[]; expiresAt: number }>();
const groqPickCache = new Map<string, { model: string | null; expiresAt: number }>();

function groqKeyHash(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex").slice(0, 24);
}

function normalizeGroqEmbeddingModelId(model: string): string {
  const m = model.trim();
  if (m === GROQ_EMBED_MODEL_AUTO_SENTINEL) return m;
  if (m === "nomic-embed-text-v1.5") return "nomic-embed-text-v1_5";
  return m;
}

/** Normalisation variants when matching Groq’s model catalog. */
function groqEmbeddingPreferredVariants(preferred: string): string[] {
  const p = preferred.trim();
  const out = new Set<string>([p, normalizeGroqEmbeddingModelId(p)]);
  const withUnderscore = p.replace(/v1\.5/gi, "v1_5");
  const withDot = p.replace(/v1_5/gi, "v1.5");
  out.add(withUnderscore);
  out.add(withDot);
  return [...out].filter((x) => x !== GROQ_EMBED_MODEL_AUTO_SENTINEL && x.length > 0);
}

/** Picks Groq embedding model id from `/v1/models` list; exported for unit tests only. */
export function pickGroqEmbeddingModelFromIds(allIds: string[], preferredHint: string): string | null {
  const embedIds = [...new Set(allIds.filter((id) => /embed/i.test(id)))].sort();
  if (embedIds.length === 0) return null;
  if (preferredHint === GROQ_EMBED_MODEL_AUTO_SENTINEL) return embedIds[0] ?? null;

  const variants = groqEmbeddingPreferredVariants(preferredHint);
  for (const v of variants) {
    if (embedIds.includes(v)) return v;
  }
  return null;
}

async function fetchGroqModelIds(apiKey: string): Promise<string[]> {
  const hk = groqKeyHash(apiKey);
  const now = Date.now();
  const cached = groqModelListCache.get(hk);
  if (cached && cached.expiresAt > now) return cached.ids;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("groq-models-timeout"), 12_000);
  const res = await fetch(GROQ_MODELS_ENDPOINT, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Groq models HTTP ${res.status}: ${raw.slice(0, 200)}`);
  }
  let parsed: { data?: { id?: string }[] };
  try {
    parsed = JSON.parse(raw) as { data?: { id?: string }[] };
  } catch {
    throw new Error("Groq models: invalid JSON response.");
  }
  const ids = (parsed.data ?? []).map((row) => row.id?.trim()).filter((x): x is string => Boolean(x));
  groqModelListCache.set(hk, { ids, expiresAt: now + GROQ_MODEL_LIST_CACHE_MS });
  return ids;
}

/** Resolves concrete Groq embedding model id from API (+ cache); `null` when none. */
export async function resolveGroqEmbeddingModelId(apiKey: string, hintedModel: string): Promise<string | null> {
  const cacheKey = `${groqKeyHash(apiKey)}::${hintedModel}`;
  const now = Date.now();
  const pc = groqPickCache.get(cacheKey);
  if (pc && pc.expiresAt > now) return pc.model;

  try {
    const allIds = await fetchGroqModelIds(apiKey);
    let model = pickGroqEmbeddingModelFromIds(allIds, hintedModel);
    const embedListed = [...new Set(allIds.filter((id) => /embed/i.test(id)))];
    if (model === null) {
      if (embedListed.length === 0 || hintedModel === GROQ_EMBED_MODEL_AUTO_SENTINEL) {
        groqPickCache.set(cacheKey, { model: null, expiresAt: now + GROQ_MODEL_LIST_CACHE_MS });
        return null;
      }
      model = normalizeGroqEmbeddingModelId(hintedModel);
    }
    groqPickCache.set(cacheKey, { model, expiresAt: now + GROQ_MODEL_LIST_CACHE_MS });
    return model;
  } catch {
    groqPickCache.set(cacheKey, { model: null, expiresAt: now + 120_000 });
    return null;
  }
}

export function normalizeEmbeddingInputs(texts: string[]): string[] {
  return texts.map((t, i) => {
    const s = typeof t === "string" ? t.trim() : "";
    if (s.length > 0) return s;
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[embeddings] Empty input at index ${i} — substituting a single space (API rejects empty strings).`
      );
    }
    return " ";
  });
}

export function logEmbeddingFailure(
  where: string,
  err: unknown,
  cfg?: EmbeddingsEndpointConfig | null
): void {
  const msg = err instanceof Error ? err.message : String(err);
  let routeHint = "";
  if (cfg) {
    try {
      const host = new URL(cfg.url).host;
      routeHint = ` [${cfg.provider} @ ${host}; model=${cfg.model}]`;
    } catch {
      routeHint = ` [${cfg.provider}; model=${cfg.model}]`;
    }
  }
  console.warn(`[embeddings:${where}]${routeHint} ${msg}`);
}

/** Trim, strip BOM, strip optional quotes around `.env` values. */
export function normalizeEnvApiKey(raw: string | undefined): string | null {
  if (raw == null) return null;
  let s = raw.replace(/\uFEFF/g, "").trim();
  if (
    (s.startsWith('"') && s.endsWith('"') && s.length >= 2) ||
    (s.startsWith("'") && s.endsWith("'") && s.length >= 2)
  ) {
    s = s.slice(1, -1).trim();
  }
  return s.length > 0 ? s : null;
}

/**
 * Cosine similarity between vectors (also works if norms are unconventional, e.g. Voyage).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    const y = b[i]!;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

/**
 * Maps cosine (often ~0.45–0.92 for realistic text similarity) onto 0–100.
 * Bounds are pragmatic defaults; override via MATCH_EMBED_COSINE_* env.
 */
export function semanticScoreFromCosine(cosine: number): number {
  const lo = Number(process.env.MATCH_EMBED_COSINE_LO?.trim() || "0.42");
  const hi = Number(process.env.MATCH_EMBED_COSINE_HI?.trim() || "0.90");
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) {
    return Math.min(100, Math.max(0, Math.round(cosine * 100)));
  }
  const t = (cosine - lo) / (hi - lo);
  return Math.min(100, Math.max(0, Math.round(t * 100)));
}

/** Heuristic + semantic weights for researcher dashboard ranking. */
export function blendRankingScores(heuristicScore: number, semantic0to100: number): number {
  const wH = Number(process.env.MATCH_RANK_HEURISTIC_WEIGHT?.trim() || "0.38");
  const wS = Number(process.env.MATCH_RANK_SEMANTIC_WEIGHT?.trim() || "0.62");
  const sum = wH + wS;
  const nh = sum > 0 ? wH / sum : 0.5;
  const ns = sum > 0 ? wS / sum : 0.5;
  return Math.min(100, Math.round(nh * heuristicScore + ns * semantic0to100));
}

/** Weights for persisted application match scoring (LLM + embedding mix). */
export function blendApplicationMatchScores(llmScore: number, semantic0to100: number): number {
  const wL = Number(process.env.MATCH_APPLY_LLM_WEIGHT?.trim() || "0.42");
  const wE = Number(process.env.MATCH_APPLY_EMBED_WEIGHT?.trim() || "0.58");
  const sum = wL + wE;
  const nl = sum > 0 ? wL / sum : 0.5;
  const ne = sum > 0 ? wE / sum : 0.5;
  return Math.min(100, Math.round(nl * llmScore + ne * semantic0to100));
}

function openAiEmbedModel(): string {
  return (
    process.env.OPENAI_EMBEDDING_MODEL?.trim() ||
    process.env.OPENAI_EMBEDDINGS_MODEL?.trim() ||
    "text-embedding-3-small"
  );
}

function openAiTrioPresent(): boolean {
  return Boolean(
    normalizeEnvApiKey(process.env.OPENAI_API_KEY) &&
      process.env.OPENAI_BASE_URL?.trim() &&
      process.env.OPENAI_MODEL?.trim()
  );
}

/** `auto` follows the LLM routing signal (AI_PROVIDER / key precedence). */
export type EmbeddingProviderMode = "auto" | "groq" | "openai" | "voyage";

function embeddingProviderMode(): EmbeddingProviderMode {
  const raw = process.env.EMBEDDING_PROVIDER?.trim().toLowerCase();
  if (raw === "groq") return "groq";
  if (raw === "openai") return "openai";
  if (raw === "voyage") return "voyage";
  return "auto";
}

/** OpenAI-compat: standalone key or chat key; base resolves to `/v1/embeddings`. */
function openAiCompatibleEmbeddingsWithKey(apiKey: string): EmbeddingsEndpointConfig {
  const base =
    process.env.OPENAI_EMBEDDINGS_BASE_URL?.trim() || process.env.OPENAI_BASE_URL?.trim();
  if (base) {
    const root = base.replace(/\/$/, "");
    const url = root.endsWith("/embeddings") ? root : `${root}/embeddings`;
    return {
      url,
      apiKey,
      model: openAiEmbedModel(),
      provider: "openai_compatible",
    };
  }
  return {
    url: "https://api.openai.com/v1/embeddings",
    apiKey,
    model: openAiEmbedModel(),
    provider: "openai_compatible",
  };
}

/**
 * Boilerplate `.env` often ships OPENAI_EMBEDDINGS_API_KEY even when Groq owns chat —
 * that would ping OpenAI with the wrong credential. Under LLM=groq + auto we skip the
 * dedicated OpenAI embeddings key unless EMBEDDING_PROVIDER=openai.
 */
function shouldUseDedicatedOpenAiEmbeddingsKey(
  llm: LlmBackend | null,
  mode: EmbeddingProviderMode
): boolean {
  if (mode === "openai") return true;
  if (mode === "groq" || mode === "voyage") return false;
  if (mode === "auto") {
    if (llm === "groq") return false;
    if (llm === "openai_compatible" || llm === "anthropic") return true;
    if (llm === null) return true;
  }
  return true;
}

function shouldIgnoreOfficialOpenAiEmbeddingsTemplateUrl(
  url: string,
  llm: LlmBackend | null,
  mode: EmbeddingProviderMode
): boolean {
  if (mode !== "auto" || llm !== "groq") return false;
  try {
    return new URL(url).hostname === "api.openai.com";
  } catch {
    return false;
  }
}

/** Hard URL override for OpenAI-shaped proxies (including OpenRouter-style hosts). */
function tryDedicatedOpenAiUrl(llm: LlmBackend | null, mode: EmbeddingProviderMode): EmbeddingsEndpointConfig | null {
  const url = process.env.OPENAI_EMBEDDINGS_URL?.trim();
  if (!url) return null;

  /** Boilerplate OPENAI_EMBEDDINGS_URL while chat is Groq — ignore unless EMBEDDING_PROVIDER=openai. */
  if (shouldIgnoreOfficialOpenAiEmbeddingsTemplateUrl(url, llm, mode)) {
    return null;
  }

  let apiKey =
    normalizeEnvApiKey(process.env.OPENAI_EMBEDDINGS_API_KEY) ??
    normalizeEnvApiKey(process.env.OPENAI_API_KEY);

  if (!apiKey && url.includes("groq.com") && mode === "auto" && llm === "groq") {
    apiKey = normalizeEnvApiKey(process.env.GROQ_API_KEY);
  }

  if (!apiKey) return null;

  const groqEmbedModel = normalizeGroqEmbeddingModelId(
    process.env.GROQ_EMBEDDING_MODEL?.trim() ||
      process.env.GROQ_EMBEDDINGS_MODEL?.trim() ||
      GROQ_EMBED_MODEL_AUTO_SENTINEL
  );

  return {
    url,
    apiKey,
    model: url.includes("groq.com") ? groqEmbedModel : openAiEmbedModel(),
    provider: url.includes("groq.com") ? "groq" : "openai_compatible",
  };
}

/** Dedicated OpenAI key for embeddings without using chat OPENAI_BASE_URL. */
function tryDedicatedOpenAiEmbeddingsKey(): EmbeddingsEndpointConfig | null {
  const k = normalizeEnvApiKey(process.env.OPENAI_EMBEDDINGS_API_KEY);
  if (!k) return null;
  if (process.env.OPENAI_EMBEDDINGS_URL?.trim()) return null;
  return openAiCompatibleEmbeddingsWithKey(k);
}

function tryGroqEmbeddings(): EmbeddingsEndpointConfig | null {
  const key = normalizeEnvApiKey(process.env.GROQ_API_KEY);
  if (!key) return null;
  const rawModel =
    process.env.GROQ_EMBEDDING_MODEL?.trim() ||
    process.env.GROQ_EMBEDDINGS_MODEL?.trim() ||
    GROQ_EMBED_MODEL_AUTO_SENTINEL;
  const model = normalizeGroqEmbeddingModelId(rawModel);
  return {
    url: "https://api.groq.com/openai/v1/embeddings",
    apiKey: key,
    model,
    provider: "groq",
  };
}

function tryVoyageEmbeddings(): EmbeddingsEndpointConfig | null {
  const key = normalizeEnvApiKey(process.env.VOYAGE_API_KEY);
  if (!key) return null;
  const url = process.env.VOYAGE_EMBEDDINGS_URL?.trim() || "https://api.voyageai.com/v1/embeddings";
  const model =
    process.env.VOYAGE_EMBEDDING_MODEL?.trim() ||
    process.env.VOYAGE_EMBEDDINGS_MODEL?.trim() ||
    "voyage-3-large";
  return { url, apiKey: key, model, provider: "voyage" };
}

function resolveByLlmEmbeddingAuto(llm: LlmBackend | null): EmbeddingsEndpointConfig | null {
  if (!llm) return null;
  if (llm === "groq") return tryGroqEmbeddings();

  if (llm === "openai_compatible") {
    const key = normalizeEnvApiKey(process.env.OPENAI_API_KEY);
    if (!key || !openAiTrioPresent()) return null;
    return openAiCompatibleEmbeddingsWithKey(key);
  }

  /** Anthropic has no embeddings API surface — rely on Voyage or a standalone OpenAI key. */
  if (llm === "anthropic") {
    const voyage = tryVoyageEmbeddings();
    if (voyage) return voyage;
    const oa = normalizeEnvApiKey(process.env.OPENAI_API_KEY);
    if (oa) return openAiCompatibleEmbeddingsWithKey(oa);
    return null;
  }

  return null;
}

/**
 * Embedding routing synced with LLM routing (`resolveLlmBackend`), with caveats:
 * - `OPENAI_EMBEDDINGS_URL` (ignored when pointing at api.openai.com while chat stays Groq on auto),
 * - `OPENAI_EMBEDDINGS_API_KEY` similarly ignored under Groq + auto → we reuse `GROQ_API_KEY` (avoids fake “Invalid API Key” from OpenAI),
 * - `EMBEDDING_PROVIDER=groq|openai|voyage` selects the embeddings vendor explicitly.
 */
export function resolveEmbeddingsEndpoint(): EmbeddingsEndpointConfig | null {
  const mode = embeddingProviderMode();
  const llm = resolveLlmBackend();

  const fromUrl = tryDedicatedOpenAiUrl(llm, mode);
  if (fromUrl) return fromUrl;

  const dedicatedKeyCfg = tryDedicatedOpenAiEmbeddingsKey();
  if (dedicatedKeyCfg && shouldUseDedicatedOpenAiEmbeddingsKey(llm, mode)) {
    return dedicatedKeyCfg;
  }

  if (mode === "groq") {
    return tryGroqEmbeddings();
  }
  if (mode === "openai") {
    const key = normalizeEnvApiKey(process.env.OPENAI_API_KEY);
    if (!key) return null;
    return openAiCompatibleEmbeddingsWithKey(key);
  }
  if (mode === "voyage") {
    return tryVoyageEmbeddings();
  }

  return resolveByLlmEmbeddingAuto(llm);
}

export function hasEmbeddingsConfigured(): boolean {
  return resolveEmbeddingsEndpoint() !== null;
}

type CachedVec = number[];

const embeddingVectorCache = new Map<string, CachedVec>();

function cacheKey(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function cacheGet(text: string): number[] | undefined {
  return embeddingVectorCache.get(cacheKey(text));
}

function cacheSet(text: string, vec: number[]): void {
  const key = cacheKey(text);
  if (embeddingVectorCache.size >= CACHE_MAX && !embeddingVectorCache.has(key)) {
    const first = embeddingVectorCache.keys().next().value as string | undefined;
    if (first) embeddingVectorCache.delete(first);
  }
  embeddingVectorCache.set(key, vec);
}

type OpenAiShapeEmbeddingResponse = {
  data?: { embedding?: number[] | string; index?: number }[];
  error?: { message?: string };
};

const BATCH = 96;

async function fetchEmbeddingsUncached(cfg: EmbeddingsEndpointConfig, inputs: string[]) {
  const safeInput = normalizeEmbeddingInputs(inputs);

  const body: Record<string, unknown> = { model: cfg.model, input: safeInput };
  if (cfg.provider === "groq") {
    body.encoding_format = "float";
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("embedding-timeout"), EMBEDDING_TIMEOUT_MS);
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));

  const rawText = await res.text();
  let parsed: OpenAiShapeEmbeddingResponse;
  try {
    parsed = JSON.parse(rawText) as OpenAiShapeEmbeddingResponse;
  } catch {
    throw new Error(`Embeddings API: invalid response body for HTTP ${res.status}.`);
  }
  if (!res.ok || parsed.error) {
    throw new Error(
      parsed.error?.message || `Embeddings HTTP ${res.status}: ${rawText.slice(0, 200)}`
    );
  }
  const rows = parsed.data ?? [];
  const sorted = [...rows].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const vectors = sorted.map((row) => row.embedding);
  const valid = vectors.map((emb) =>
    normalizeEmbeddingVector(emb, cfg.provider === "groq" ? cfg.model : "")
  );

  const badIndex = valid.findIndex((v) => !v || v.length === 0);
  if (vectors.length !== safeInput.length || badIndex !== -1) {
    const sampleRow = sorted[badIndex >= 0 ? badIndex : 0];
    const embType =
      Array.isArray(sampleRow?.embedding) ? "number[]"
      : typeof sampleRow?.embedding === "string" ? "string(base64)"
      : typeof sampleRow?.embedding;
    throw new Error(
      `Embeddings API returned an incomplete vector list (index ${badIndex}, element type: ${embType}).`
    );
  }
  return valid as number[][];
}

/** Groq payloads may encode vectors as float[] or base64; canonical OpenAI is float[]. */
function normalizeEmbeddingVector(emb: unknown, groqModelHint: string): number[] | null {
  if (Array.isArray(emb) && emb.length > 0 && typeof emb[0] === "number") {
    return emb as number[];
  }
  if (typeof emb === "string" && emb.length > 0) {
    try {
      const buf = Buffer.from(emb, "base64");
      const floatCount = Math.floor(buf.byteLength / 4);
      const floats = new Float32Array(buf.buffer, buf.byteOffset, floatCount);
      return Array.from(floats);
    } catch {
      return null;
    }
  }
  if (groqModelHint && process.env.NODE_ENV === "development") {
    console.warn(`[embeddings] Unexpected vector format for model ${groqModelHint}`);
  }
  return null;
}

/**
 * Embeddings for arbitrary text batches (indexed vectors).
 * Relies on in-process cache plus request batching.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const cfgBase = resolveEmbeddingsEndpoint();
  if (!cfgBase) {
    throw new Error(
      "Embeddings not configured. For Groq: set GROQ_API_KEY; for Anthropic: VOYAGE_API_KEY or OPENAI_API_KEY; see EMBEDDING_PROVIDER in .env.example."
    );
  }

  let cfg = cfgBase;
  if (cfg.provider === "groq") {
    const resolvedModel = await resolveGroqEmbeddingModelId(cfg.apiKey, cfg.model);
    if (!resolvedModel) {
      logGroqEmbeddingsUnavailableOnce(
        "This Groq API key has no usable embedding models: GET /openai/v1/models returns no model id matching \"embed\". " +
          "Ranking will fall back to heuristics only, or configure another embeddings endpoint (e.g. OPENAI_EMBEDDINGS_BASE_URL to local Ollama + EMBEDDING_PROVIDER=openai)."
      );
      throw new GroqEmbeddingsUnavailableError(
        "Groq embeddings: no embedding model on the API list — see the [embeddings:Groq] log line above."
      );
    }
    cfg = { ...cfg, model: resolvedModel };
  }

  const results: number[][] = new Array(texts.length);
  const missIndices: number[] = [];
  const missTexts: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const cached = cacheGet(texts[i]!);
    if (cached) {
      results[i] = cached;
    } else {
      missIndices.push(i);
      missTexts.push(texts[i]!);
    }
  }

  if (missTexts.length === 0) {
    return results;
  }

  const fetchedChunks: number[][] = [];
  for (let offset = 0; offset < missTexts.length; offset += BATCH) {
    const slice = missTexts.slice(offset, offset + BATCH);
    const vecs = await fetchEmbeddingsUncached(cfg, slice);
    fetchedChunks.push(...vecs);
  }

  for (let j = 0; j < missIndices.length; j++) {
    const globalIdx = missIndices[j]!;
    const vec = fetchedChunks[j]!;
    cacheSet(texts[globalIdx]!, vec);
    results[globalIdx] = vec;
  }

  return results;
}

/** Two texts → one embeddings round-trip → cosine mapped to a 0–100 score. */
export async function computePairSemanticScore(
  researcherText: string,
  briefText: string
): Promise<number | null> {
  if (!hasEmbeddingsConfigured()) return null;
  try {
    const vectors = await embedTexts([researcherText, briefText]);
    const a = vectors[0];
    const b = vectors[1];
    if (!a?.length || !b?.length) return null;
    return semanticScoreFromCosine(cosineSimilarity(a, b));
  } catch {
    return null;
  }
}
