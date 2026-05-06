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
  early_builder: "Budujący profil praktyczny",
  applied_researcher: "Badacz aplikacyjny",
  industry_ready: "Gotowy do współpracy z firmą",
  deep_expert: "Ekspert głębokiej specjalizacji",
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
    signals.push("szeroki zestaw umiejętności praktycznych");
  } else if (skills.length >= 3) {
    score += 15;
    signals.push("minimum 3 praktyczne umiejętności");
  }

  if (projects.length >= 3) {
    score += 20;
    signals.push("kilka opisanych projektów");
  } else if (projects.length >= 1) {
    score += 10;
    signals.push("opisany projekt badawczy lub wdrożeniowy");
  }

  if (industryProjects.length > 0) {
    score += 20;
    signals.push("doświadczenie blisko zastosowań biznesowych");
  }

  if (publications.length >= 2) {
    score += 20;
    signals.push("potwierdzony dorobek publikacyjny");
  } else if (publications.length === 1) {
    score += 10;
    signals.push("pierwszy link do publikacji lub profilu naukowego");
  }

  if (descriptionLength >= 600) {
    score += 15;
    signals.push("dobrze opisany kontekst badań");
  } else if (descriptionLength >= 150) {
    score += 10;
    signals.push("czytelny opis badań");
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
      "Profil ma potencjał, ale największą wartość da doprecyzowanie projektów, umiejętności i dostępności.",
    applied_researcher:
      "Profil dobrze nadaje się do przeglądów literatury, konsultacji i małych zadań R&D.",
    industry_ready:
      "Profil wygląda na gotowy do rozmów z firmami o proof-of-concept lub krótkim projekcie R&D.",
    deep_expert:
      "Profil pokazuje głęboką specjalizację i dorobek, który warto kierować do bardziej złożonych briefów.",
  };

  return {
    tier,
    label: labels[tier],
    summary: summaryByTier[tier],
    score: Math.min(100, score),
    signals: signals.length > 0 ? signals : ["uzupełnij profil, aby zobaczyć mocniejsze sygnały"],
  };
}
