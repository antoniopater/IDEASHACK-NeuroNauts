export type ResearcherClassificationTier =
  | "early_builder"
  | "applied_researcher"
  | "industry_ready"
  | "deep_expert";

export type ResearcherClassificationInput = {
  stage?: string | null;
  research_description?: string | null;
  practical_skills?: string[] | null;
  publication_links?: string[] | null;
  projects?: Array<{
    title?: string | null;
    description?: string | null;
    type?: string | null;
  }> | null;
};

export type ResearcherClassification = {
  tier: ResearcherClassificationTier;
  label: string;
  summary: string;
  score: number;
  signals: string[];
};

const labels: Record<ResearcherClassificationTier, string> = {
  early_builder: "Building practical profile",
  applied_researcher: "Applied researcher",
  industry_ready: "Industry-ready",
  deep_expert: "Deep domain expert",
};

export function classifyResearcher(
  input: ResearcherClassificationInput
): ResearcherClassification {
  const projects = input.projects ?? [];
  const skills = (input.practical_skills ?? []).filter(Boolean);
  const publications = (input.publication_links ?? []).filter(Boolean);
  const descriptionLength = (input.research_description ?? "").trim().length;
  const industryProjects = projects.filter((p) =>
    ["industry", "consultation", "internship"].includes(p.type ?? "")
  );

  let score = 0;
  const signals: string[] = [];

  if (skills.length >= 6) {
    score += 25;
    signals.push("broad set of practical skills");
  } else if (skills.length >= 3) {
    score += 15;
    signals.push("at least 3 practical skills");
  }

  if (projects.length >= 3) {
    score += 20;
    signals.push("multiple described projects");
  } else if (projects.length >= 1) {
    score += 10;
    signals.push("research or industry project on record");
  }

  if (industryProjects.length > 0) {
    score += 20;
    signals.push("experience close to business applications");
  }

  if (publications.length >= 2) {
    score += 20;
    signals.push("verified publication record");
  } else if (publications.length === 1) {
    score += 10;
    signals.push("first publication or academic profile link");
  }

  if (descriptionLength >= 600) {
    score += 15;
    signals.push("well-described research context");
  } else if (descriptionLength >= 150) {
    score += 10;
    signals.push("clear research description");
  }

  const stage = input.stage ?? "";
  let tier: ResearcherClassificationTier = "early_builder";
  if (score >= 75 && (stage === "doktor" || stage === "postdoc" || publications.length >= 2)) {
    tier = "deep_expert";
  } else if (score >= 65 || industryProjects.length > 0) {
    tier = "industry_ready";
  } else if (score >= 40) {
    tier = "applied_researcher";
  }

  const summaryByTier: Record<ResearcherClassificationTier, string> = {
    early_builder:
      "Profile has potential — the biggest gains come from detailing projects, skills and availability.",
    applied_researcher:
      "Profile is well-suited for literature reviews, consultations and small R&D tasks.",
    industry_ready:
      "Profile looks ready for company conversations about proof-of-concept or a short R&D engagement.",
    deep_expert:
      "Profile shows deep specialisation and a track record — best matched to complex R&D briefs.",
  };

  return {
    tier,
    label: labels[tier],
    summary: summaryByTier[tier],
    score: Math.min(100, score),
    signals: signals.length > 0 ? signals : ["complete your profile to see stronger signals"],
  };
}
