import {
  blendRankingScores,
  cosineSimilarity,
  embedTexts,
  GroqEmbeddingsUnavailableError,
  hasEmbeddingsConfigured,
  logEmbeddingFailure,
  resolveEmbeddingsEndpoint,
  semanticScoreFromCosine,
} from "@/lib/embeddings";
import { buildBriefEmbeddingText, buildResearcherEmbeddingText } from "@/lib/match-text";
import { aiBriefResponseSchema, type AiBriefContent } from "@/lib/validations";

export type RecommendationResearcher = {
  research_domain?: string | null;
  research_subdomain?: string | null;
  research_description?: string | null;
  practical_skills?: string[] | null;
  availability_hours_per_week?: number | null;
  availability_modes?: string[] | null;
};

/** Extra researcher profile fields used for embeddings and stronger ranking. */
export type ResearcherMatchingInput = RecommendationResearcher & {
  stage?: string | null;
  motivation?: string | null;
};

export type RecommendationBrief = {
  id: string;
  published_at: string | null;
  raw_input: unknown;
  final_content: unknown;
};

export type BriefRecommendation = {
  briefId: string;
  score: number;
  industry: string;
  timeline: string;
  cel_rd: string;
  requiredSkills: string[];
  reasons: string[];
  gaps: string[];
  published_at: string | null;
  /** Rule-based score before blending with embeddings. */
  heuristicScore: number;
  /** Purely semantic score (0–100) after embeddings succeed. */
  semanticScore?: number;
};

const domainIndustryHints: Record<string, string[]> = {
  "Computer Science & AI": ["IT", "software", "Fintech", "Transport"],
  "Chemistry & Materials Science": ["Chemistry", "materials", "Pharmaceuticals"],
  "Natural Sciences": ["Pharmaceuticals", "biotech", "Agriculture", "food"],
  "Medical Sciences & Health": ["Medicine", "health", "Pharmaceuticals"],
  "Engineering & Technology": ["Manufacturing", "Energy", "Transport", "IT"],
  "Informatyka i AI": ["IT", "oprogramowanie", "software", "programming", "Fintech", "Transport"],
  "Chemia i materiałoznawstwo": ["Chemia", "chemistry", "materiały", "materials", "Farmaceutyka", "pharma", "pharmaceutical"],
  "Nauki przyrodnicze": ["Farmaceutyka", "pharma", "biotech", "Rolnictwo", "agriculture", "żywność", "food"],
  "Nauki medyczne i zdrowie": ["Medycyna", "medicine", "health", "Farmaceutyka", "pharma"],
  "Inżynieria i technologia": ["Produkcja", "production", "Energetyka", "energy", "Transport", "IT"],
};

type BriefRawShape = { industry?: string; timeline?: string; budget?: string };

function readBriefRaw(raw_input: unknown): BriefRawShape {
  return (raw_input ?? {}) as BriefRawShape;
}

export function recommendBriefsForResearcher(
  researcher: RecommendationResearcher,
  briefs: RecommendationBrief[],
  limit = 5
): BriefRecommendation[] {
  return briefs
    .map((brief) => scoreBrief(researcher, brief))
    .filter((item): item is BriefRecommendation => item !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Rank briefs using cosine similarity embeddings plus legacy heuristics.
 * Falls back to heuristics when the API key is missing or embeddings fail.
 * Embeddings are computed for the top K briefs by heuristic (rest stay heuristic-only to save quota).
 */
export async function recommendBriefsForResearcherAsync(
  researcher: ResearcherMatchingInput,
  briefs: RecommendationBrief[],
  options?: { limit?: number; projectsSummary?: string | null }
): Promise<BriefRecommendation[]> {
  const limit = options?.limit ?? 5;
  const prepared: {
    brief: RecommendationBrief;
    parsed: AiBriefContent;
    raw: BriefRawShape;
    heuristic: BriefRecommendation;
  }[] = [];

  for (const brief of briefs) {
    const content = aiBriefResponseSchema.safeParse(brief.final_content);
    if (!content.success) continue;
    const raw = readBriefRaw(brief.raw_input);
    const h = scoreRecommendationHeuristic(researcher, brief, content.data, raw);
    if (h) prepared.push({ brief, parsed: content.data, raw, heuristic: h });
  }

  if (prepared.length === 0) return [];

  let topPicks: BriefRecommendation[];

  if (!hasEmbeddingsConfigured()) {
    topPicks = prepared
      .map((p) => p.heuristic)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return topPicks;
  }

  const poolSizeRaw = Number(process.env.MATCH_SEMANTIC_POOL_SIZE?.trim() || "48");
  const poolSize = Number.isFinite(poolSizeRaw)
    ? Math.max(limit, Math.min(200, Math.floor(poolSizeRaw)))
    : 48;

  const byHeuristicDesc = [...prepared].sort((a, b) => b.heuristic.score - a.heuristic.score);
  const semanticPool = byHeuristicDesc.slice(0, poolSize);
  const tail = byHeuristicDesc.slice(poolSize);

  try {
    const researcherText = buildResearcherEmbeddingText(researcher, options?.projectsSummary);
    const briefTexts = semanticPool.map((p) => buildBriefEmbeddingText(p.parsed, p.raw));
    const vectors = await embedTexts([researcherText, ...briefTexts]);
    const researcherVec = vectors[0];
    if (!researcherVec || vectors.length !== briefTexts.length + 1) {
      throw new Error("Incomplete embeddings response.");
    }

    const blended = semanticPool.map((p, idx) => {
      const cosine = cosineSimilarity(researcherVec, vectors[idx + 1]!);
      const sem = semanticScoreFromCosine(cosine);
      const base = p.heuristic;
      const score = blendRankingScores(base.heuristicScore, sem);
      const reasons = [...base.reasons];
      const gaps = [...base.gaps];
      applySemanticBullets(reasons, gaps, sem);
      return {
        ...base,
        score: Math.min(100, score),
        semanticScore: sem,
        reasons,
        gaps,
      } satisfies BriefRecommendation;
    });

    const tailRecs = tail.map((p) => ({ ...p.heuristic }));
    const merged = [...blended, ...tailRecs].sort((a, b) => b.score - a.score);
    topPicks = merged.slice(0, limit);
  } catch (e) {
    if (!(e instanceof GroqEmbeddingsUnavailableError)) {
      logEmbeddingFailure("recommendBriefsForResearcher.asyncPool", e, resolveEmbeddingsEndpoint());
    }
    topPicks = prepared
      .map((p) => p.heuristic)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  return await ensureSemanticsOnTopPicks(topPicks, researcher, briefs, options?.projectsSummary);
}

function applySemanticBullets(reasons: string[], gaps: string[], sem: number): void {
  if (sem >= 72) {
    reasons.unshift(`strong semantic match between your profile and the brief text (${sem}/100)`);
  } else if (sem >= 52) {
    reasons.push(`good semantic overlap between descriptions (${sem}/100)`);
  } else if (sem < 38) {
    gaps.push(
      "low semantic match — verify the brief aligns with your expertise before applying"
    );
  }
}

/** Fills semanticScore for top-ranked rows missed by the large pool batch. */
async function ensureSemanticsOnTopPicks(
  topPicks: BriefRecommendation[],
  researcher: ResearcherMatchingInput,
  briefs: RecommendationBrief[],
  projectsSummary?: string | null
): Promise<BriefRecommendation[]> {
  if (!hasEmbeddingsConfigured()) return topPicks;

  const missing = topPicks.filter((r) => r.semanticScore == null);
  if (missing.length === 0) return topPicks;

  try {
    const researcherText = buildResearcherEmbeddingText(researcher, projectsSummary);
    const payloads: { recIndex: number; text: string }[] = [];

    for (let i = 0; i < topPicks.length; i++) {
      const rec = topPicks[i]!;
      if (rec.semanticScore != null) continue;
      const brief = briefs.find((b) => b.id === rec.briefId);
      if (!brief) continue;
      const parsed = aiBriefResponseSchema.safeParse(brief.final_content);
      if (!parsed.success) continue;
      const raw = readBriefRaw(brief.raw_input);
      payloads.push({
        recIndex: i,
        text: buildBriefEmbeddingText(parsed.data, raw),
      });
    }

    if (payloads.length === 0) {
      logEmbeddingFailure(
        "ensureSemanticsOnTopPicks",
        new Error(
          "Could not map top recommendations to parsed brief content (missing id or parse failure) — semantic pass skipped."
        )
      );
      return topPicks;
    }

    const vectors = await embedTexts([researcherText, ...payloads.map((p) => p.text)]);
    const ref = vectors[0];
    if (!ref) return topPicks;

    for (let j = 0; j < payloads.length; j++) {
      const { recIndex } = payloads[j]!;
      const vec = vectors[j + 1];
      if (!vec) continue;
      const rec = topPicks[recIndex]!;
      const sem = semanticScoreFromCosine(cosineSimilarity(ref, vec));
      const hr = rec.heuristicScore;
      rec.semanticScore = sem;
      rec.score = Math.min(100, blendRankingScores(hr, sem));
      const reasons = [...rec.reasons];
      const gaps = [...rec.gaps];
      applySemanticBullets(reasons, gaps, sem);
      rec.reasons = reasons;
      rec.gaps = gaps;
    }

    return [...topPicks].sort((a, b) => b.score - a.score);
  } catch (e) {
    if (!(e instanceof GroqEmbeddingsUnavailableError)) {
      logEmbeddingFailure("ensureSemanticsOnTopPicks", e, resolveEmbeddingsEndpoint());
    }
    return topPicks;
  }
}

function scoreBrief(
  researcher: RecommendationResearcher,
  brief: RecommendationBrief
): BriefRecommendation | null {
  const content = aiBriefResponseSchema.safeParse(brief.final_content);
  if (!content.success) return null;
  return scoreRecommendationHeuristic(researcher, brief, content.data, readBriefRaw(brief.raw_input));
}

function scoreRecommendationHeuristic(
  researcher: RecommendationResearcher,
  brief: RecommendationBrief,
  parsed: AiBriefContent,
  raw: BriefRawShape
): BriefRecommendation | null {
  const haystack = [
    parsed.cel_rd,
    parsed.zakres_projektu,
    parsed.suggested_researcher_profile,
    parsed.wymagane_kompetencje.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  const skills = (researcher.practical_skills ?? []).filter(Boolean);
  const matchedSkills = skills.filter((skill) => tokenOverlap(skill, haystack));
  const subdomain = researcher.research_subdomain ?? "";
  const domain = researcher.research_domain ?? "";
  const industry = raw.industry ?? "—";
  const reasons: string[] = [];
  const gaps: string[] = [];
  let score = 20;

  if (domain && industryMatchesDomain(domain, industry)) {
    score += 20;
    reasons.push(`Profile domain matches industry: ${industry}`);
  }

  if (subdomain && tokenOverlap(subdomain, haystack)) {
    score += 15;
    reasons.push("Subdiscipline appears in the brief description");
  }

  if (matchedSkills.length > 0) {
    score += Math.min(30, matchedSkills.length * 10);
    reasons.push(`Matching skills: ${matchedSkills.slice(0, 3).join(", ")}`);
  } else {
    gaps.push("No clear overlap with listed skills");
  }

  const hours = researcher.availability_hours_per_week ?? 0;
  if (hours >= 12) {
    score += 10;
    reasons.push("Availability supports a small R&D project or POC");
  } else if (hours > 0) {
    score += 5;
    reasons.push("Availability is sufficient for consultation or review");
  } else {
    gaps.push("Availability details are missing");
  }

  if (
    (researcher.availability_modes ?? []).includes("literature_review") &&
    /literatur|raport|literature|review|report/i.test(haystack)
  ) {
    score += 10;
    reasons.push("Brief appears suitable for literature review/expert analysis");
  }
  if (
    (researcher.availability_modes ?? []).includes("proof_of_concept") &&
    /poc|proof|prototyp|implement|prototype/i.test(haystack)
  ) {
    score += 10;
    reasons.push("Brief suggests a proof-of-concept or prototype");
  }

  if (reasons.length === 0) {
    reasons.push("Project may be worth reviewing after completing the profile");
  }
  if (gaps.length === 0) {
    gaps.push("Scope and timeline details should be confirmed with the company");
  }

  const s = Math.min(100, score);
  return {
    briefId: brief.id,
    score: s,
    heuristicScore: s,
    industry,
    timeline: raw.timeline ?? "—",
    cel_rd: parsed.cel_rd,
    requiredSkills: parsed.wymagane_kompetencje,
    reasons,
    gaps,
    published_at: brief.published_at,
  };
}

function industryMatchesDomain(domain: string, industry: string): boolean {
  const hints = domainIndustryHints[domain] ?? [];
  return hints.some((hint) => industry.toLowerCase().includes(hint.toLowerCase()));
}

function tokenOverlap(needle: string, haystack: string): boolean {
  const tokens = needle
    .toLowerCase()
    .split(/[^a-zA-Z0-9]+/)
    .filter((token) => token.length >= 4);
  return tokens.some((token) => haystack.includes(token));
}
