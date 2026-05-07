import {
  GROQ_EMBED_MODEL_AUTO_SENTINEL,
  pickGroqEmbeddingModelFromIds,
} from "@/lib/embeddings";

describe("pickGroqEmbeddingModelFromIds", () => {
  it("returns null when no id contains embed", () => {
    expect(pickGroqEmbeddingModelFromIds(["llama-3-8b", "deepseek-distill"], GROQ_EMBED_MODEL_AUTO_SENTINEL)).toBeNull();
  });

  it("for sentinel picks first embedding id alphabetically", () => {
    expect(
      pickGroqEmbeddingModelFromIds(["b-embed-other", "a-embed-nomic"], GROQ_EMBED_MODEL_AUTO_SENTINEL)
    ).toBe("a-embed-nomic");
  });

  it("matches preferred model across v1_5 vs v1.5 spellings", () => {
    const ids = ["nomic-embed-text-v1_5", "other-embed"];
    expect(pickGroqEmbeddingModelFromIds(ids, "nomic-embed-text-v1.5")).toBe("nomic-embed-text-v1_5");
  });

  it("returns null when explicit hint does not match rather than forcing a random embed id", () => {
    expect(pickGroqEmbeddingModelFromIds(["zzz-embed", "aaa-embed"], "unknown-custom-embed-model")).toBeNull();
  });
});
