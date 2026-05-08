/**
 * Embeddings routing vs env — separate file so we can jest.resetModules() after process.env tweaks.
 */
describe("resolveEmbeddingsEndpoint routing", () => {
  const orig = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...orig };
  });

  afterAll(() => {
    process.env = orig;
  });

  async function resolver() {
    const { resolveEmbeddingsEndpoint } = await import("@/lib/embeddings");
    return resolveEmbeddingsEndpoint();
  }

  it("with auto + GROQ_API_KEY as LLM selects Groq /openai/v1/embeddings", async () => {
    delete process.env.OPENAI_EMBEDDINGS_URL;
    delete process.env.OPENAI_EMBEDDINGS_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OPENAI_MODEL;
    delete process.env.VOYAGE_API_KEY;
    delete process.env.AI_PROVIDER;
    delete process.env.GROQ_EMBEDDING_MODEL;
    delete process.env.GROQ_EMBEDDINGS_MODEL;
    process.env.GROQ_API_KEY = "gsk-test";
    const cfg = await resolver();
    expect(cfg).not.toBeNull();
    expect(cfg!.url).toContain("groq.com");
    expect(cfg!.provider).toBe("groq");
    const { GROQ_EMBED_MODEL_AUTO_SENTINEL } = await import("@/lib/embeddings");
    expect(cfg!.model).toBe(GROQ_EMBED_MODEL_AUTO_SENTINEL);
  });

  it("with Groq chat + auto ignores stray OPENAI_EMBEDDINGS_API_KEY so OpenAI is not hit with wrong key", async () => {
    delete process.env.OPENAI_EMBEDDINGS_URL;
    delete process.env.AI_PROVIDER;
    delete process.env.EMBEDDING_PROVIDER;
    process.env.GROQ_API_KEY = "gsk-test";
    process.env.OPENAI_EMBEDDINGS_API_KEY = "definitely-not-openai";
    const cfg = await resolver();
    expect(cfg).not.toBeNull();
    expect(cfg!.provider).toBe("groq");
    expect(cfg!.apiKey).toBe("gsk-test");
  });

  it("with Anthropic LLM routes to Voyage when VOYAGE_API_KEY is set", async () => {
    delete process.env.OPENAI_EMBEDDINGS_URL;
    delete process.env.OPENAI_EMBEDDINGS_API_KEY;
    delete process.env.GROQ_API_KEY;
    process.env.AI_PROVIDER = "anthropic";
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    process.env.VOYAGE_API_KEY = "vo-test";

    const cfg = await resolver();
    expect(cfg).not.toBeNull();
    expect(cfg!.url).toContain("voyageai.com");
    expect(cfg!.provider).toBe("voyage");
  });

  it("uses OPENAI_EMBEDDINGS_API_KEY when EMBEDDING_PROVIDER=openai alongside Groq chat", async () => {
    process.env.GROQ_API_KEY = "gsk-test";
    process.env.OPENAI_EMBEDDINGS_API_KEY = "sk-embed-openai";
    process.env.EMBEDDING_PROVIDER = "openai";

    const cfg = await resolver();
    expect(cfg).not.toBeNull();
    expect(cfg!.url).toContain("api.openai.com");
    expect(cfg!.provider).toBe("openai_compatible");
  });
});
