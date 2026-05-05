export type ProfileCompletenessInput = {
  first_name?: string | null;
  last_name?: string | null;
  institution?: string | null;
  phd_start_year?: number | null;
  stage?: string | null;
  research_description?: string | null;
  practical_skills?: string[] | null;
  projects?: Array<{ title?: string | null; description?: string | null }> | null;
  motivation?: string | null;
  availability_hours_per_week?: number | null;
  availability_modes?: string[] | null;
  publication_links?: string[] | null;
};

export type ProfileCompletenessResult = {
  score: number;
  missing: string[];
};

export function calculateProfileCompleteness(
  input: ProfileCompletenessInput
): ProfileCompletenessResult {
  const missing: string[] = [];
  let score = 0;

  const hasBasic =
    nonEmpty(input.first_name) &&
    nonEmpty(input.last_name) &&
    nonEmpty(input.institution) &&
    typeof input.phd_start_year === "number" &&
    nonEmpty(input.stage);
  if (hasBasic) {
    score += 20;
  } else {
    missing.push("Uzupełnij dane podstawowe (imię, nazwisko, uczelnia, rok, etap)");
  }

  const desc = (input.research_description ?? "").trim();
  if (desc.length >= 150) {
    score += 15;
  } else {
    missing.push("Rozszerz opis badań do co najmniej 150 znaków");
  }

  const skills = (input.practical_skills ?? []).filter((s) => nonEmpty(s));
  if (skills.length >= 3) {
    score += 15;
  } else {
    missing.push("Dodaj co najmniej 3 umiejętności praktyczne");
  }
  if (skills.length >= 6) {
    score += 5;
  }

  const projectWithDescription = (input.projects ?? []).some(
    (p) => nonEmpty(p?.title) && nonEmpty(p?.description) && (p?.description ?? "").trim().length >= 20
  );
  if (projectWithDescription) {
    score += 15;
  } else {
    missing.push("Opisz co najmniej jeden projekt (co najmniej 20 znaków opisu)");
  }

  const motivation = (input.motivation ?? "").trim();
  if (motivation.length >= 200) {
    score += 15;
  } else {
    missing.push("Rozszerz motywację do co najmniej 200 znaków");
  }

  const hasAvailability =
    typeof input.availability_hours_per_week === "number" &&
    input.availability_hours_per_week > 0 &&
    Array.isArray(input.availability_modes) &&
    input.availability_modes.length > 0;
  if (hasAvailability) {
    score += 10;
  } else {
    missing.push("Uzupełnij dostępność (godziny i formy współpracy)");
  }

  const publications = (input.publication_links ?? []).filter((u) => nonEmpty(u));
  if (publications.length >= 1) {
    score += 5;
  } else {
    missing.push("Dodaj przynajmniej jeden link do publikacji (Google Scholar / ORCID / DOI)");
  }

  return { score: Math.min(100, score), missing };
}

function nonEmpty(value: unknown): boolean {
  return typeof value === "string" ? value.trim().length > 0 : value != null;
}
