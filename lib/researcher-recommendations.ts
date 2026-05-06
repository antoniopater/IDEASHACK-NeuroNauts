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
  "Informatyka i AI": ["IT", "oprogramowanie", "Fintech", "Transport"],
  "Chemia i materiałoznawstwo": ["Chemia", "materiały", "Farmaceutyka"],
  "Nauki przyrodnicze": ["Farmaceutyka", "biotech", "Rolnictwo", "żywność"],
  "Nauki medyczne i zdrowie": ["Medycyna", "health", "Farmaceutyka"],
  "Inżynieria i technologia": ["Produkcja", "Energetyka", "Transport", "IT"],
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
    reasons.push(`dziedzina profilu pasuje do branży: ${industry}`);
  }

  if (subdomain && tokenOverlap(subdomain, haystack)) {
    score += 15;
    reasons.push("subdyscyplina pojawia się w opisie briefu");
  }

  if (matchedSkills.length > 0) {
    score += Math.min(30, matchedSkills.length * 10);
    reasons.push(`pasujące umiejętności: ${matchedSkills.slice(0, 3).join(", ")}`);
  } else {
    gaps.push("brak oczywistego overlapu z zapisanymi umiejętnościami");
  }

  const hours = researcher.availability_hours_per_week ?? 0;
  if (hours >= 12) {
    score += 10;
    reasons.push("dostępność pozwala na mały projekt R&D lub POC");
  } else if (hours > 0) {
    score += 5;
    reasons.push("dostępność wystarczy na konsultację lub przegląd");
  } else {
    gaps.push("brak uzupełnionej dostępności");
  }

  if ((researcher.availability_modes ?? []).includes("literature_review") && /literatur|raport/i.test(haystack)) {
    score += 10;
    reasons.push("brief wygląda na dobry dla przeglądu literatury/ekspertyzy");
  }
  if ((researcher.availability_modes ?? []).includes("proof_of_concept") && /poc|proof|prototyp|implement/i.test(haystack)) {
    score += 10;
    reasons.push("brief sugeruje proof-of-concept lub prototyp");
  }

  if (reasons.length === 0) {
    reasons.push("projekt może być wart sprawdzenia po uzupełnieniu profilu");
  }
  if (gaps.length === 0) {
    gaps.push("do potwierdzenia szczegóły zakresu i terminu z firmą");
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
    .split(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9]+/)
    .filter((token) => token.length >= 4);
  return tokens.some((token) => haystack.includes(token));
}
