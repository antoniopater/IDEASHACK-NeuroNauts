import {
  blendApplicationMatchScores,
  blendRankingScores,
  cosineSimilarity,
  semanticScoreFromCosine,
} from "@/lib/embeddings";

describe("cosineSimilarity", () => {
  it("is 1 for identical normalized vectors", () => {
    const v = [0.6, 0.8];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5);
  });

  it("is 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });
});

describe("semanticScoreFromCosine", () => {
  const prevLo = process.env.MATCH_EMBED_COSINE_LO;
  const prevHi = process.env.MATCH_EMBED_COSINE_HI;

  afterAll(() => {
    if (prevLo === undefined) delete process.env.MATCH_EMBED_COSINE_LO;
    else process.env.MATCH_EMBED_COSINE_LO = prevLo;
    if (prevHi === undefined) delete process.env.MATCH_EMBED_COSINE_HI;
    else process.env.MATCH_EMBED_COSINE_HI = prevHi;
  });

  it("maps cosine range onto 0–100 with default thresholds", () => {
    delete process.env.MATCH_EMBED_COSINE_LO;
    delete process.env.MATCH_EMBED_COSINE_HI;
    expect(semanticScoreFromCosine(0.42)).toBe(0);
    expect(semanticScoreFromCosine(0.9)).toBe(100);
    expect(semanticScoreFromCosine(0.66)).toBeGreaterThanOrEqual(40);
    expect(semanticScoreFromCosine(0.66)).toBeLessThanOrEqual(60);
  });
});

describe("blend scores", () => {
  it("blendRankingScores mixes heuristic and semantic weights", () => {
    const v = blendRankingScores(80, 50);
    expect(v).toBeGreaterThanOrEqual(50);
    expect(v).toBeLessThanOrEqual(80);
  });

  it("blendApplicationMatchScores mixes LLM and embedding scores", () => {
    expect(blendApplicationMatchScores(70, 90)).toBeGreaterThan(70);
  });
});
