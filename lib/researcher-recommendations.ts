import { aiBriefResponseSchema } from "@/lib/validations";

export type RecommendationResearcher = {
  research_domain?: string | null;
  research_subdomain?: string | null;
  research_description?: string | null;
  practical_skills?: string[] | null;
  availability_hours_per_week?: number | null;
  availability_modes?: string[] | null;
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
};

const domainIndustryHints: Record<string, string[]> = {
  "Computer Science & AI": ["IT", "software", "Fintech", "Transport"],
  "Chemistry & Materials Science": ["Chemistry", "materials", "Pharmaceuticals"],
  "Natural Sciences": ["Pharmaceuticals", "biotech", "Agriculture", "food"],
  "Medical Sciences & Health": ["Medicine", "health", "Pharmaceuticals"],
  "Engineering & Technology": ["Manufacturing", "Energy", "Transport", "IT"],
};

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

function scoreBrief(
  researcher: RecommendationResearcher,
  brief: RecommendationBrief
): BriefRecommendation | null {
  const content = aiBriefResponseSchema.safeParse(brief.final_content);
  if (!content.success) return null;

  const raw = (brief.raw_input ?? {}) as { industry?: string; timeline?: string };
  const haystack = [
    content.data.cel_rd,
    content.data.zakres_projektu,
    content.data.suggested_researcher_profile,
    content.data.wymagane_kompetencje.join(" "),
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

  if ((researcher.availability_modes ?? []).includes("literature_review") && /literature|report/i.test(haystack)) {
    score += 10;
    reasons.push("Brief appears suitable for literature review/expert analysis");
  }
  if ((researcher.availability_modes ?? []).includes("proof_of_concept") && /poc|proof|prototyp|implement/i.test(haystack)) {
    score += 10;
    reasons.push("Brief suggests a proof-of-concept or prototype");
  }

  if (reasons.length === 0) {
    reasons.push("Project may be worth reviewing after completing the profile");
  }
  if (gaps.length === 0) {
    gaps.push("Scope and timeline details should be confirmed with the company");
  }

  return {
    briefId: brief.id,
    score: Math.min(100, score),
    industry,
    timeline: raw.timeline ?? "—",
    cel_rd: content.data.cel_rd,
    requiredSkills: content.data.wymagane_kompetencje,
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
