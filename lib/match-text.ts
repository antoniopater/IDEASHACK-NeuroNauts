import type { AiBriefContent } from "@/lib/validations";

/** Minimalny profil do embeddingu — zgodny z RecommendationResearcher + pola z pełnego profilu. */
export type ResearcherEmbeddingInput = {
  stage?: string | null;
  motivation?: string | null;
  research_domain?: string | null;
  research_subdomain?: string | null;
  research_description?: string | null;
  practical_skills?: string[] | null;
  availability_hours_per_week?: number | null;
  availability_modes?: string[] | null;
};

const MAX_CHARS = 6000;

function clip(s: string): string {
  const t = s.trim();
  if (t.length <= MAX_CHARS) return t;
  return `${t.slice(0, MAX_CHARS)}…`;
}

/** Tekst do embeddingu badacza — spójny z promptem przy składaniu aplikacji. */
export function buildResearcherEmbeddingText(
  researcher: ResearcherEmbeddingInput,
  projectsSummary?: string | null
): string {
  const skills = (researcher.practical_skills ?? []).filter(Boolean).join(", ") || "—";
  const modes = (researcher.availability_modes ?? []).filter(Boolean).join(", ") || "—";
  const hours =
    researcher.availability_hours_per_week != null
      ? String(researcher.availability_hours_per_week)
      : "—";
  const stage = researcher.stage?.trim() || "—";
  const motivation = researcher.motivation?.trim() || "—";
  const proj = projectsSummary?.trim() || "Brak podsumowania projektów.";

  const parts = [
    `Etap kariery: ${stage}`,
    `Dziedzina i subdyscyplina: ${researcher.research_domain ?? "—"} / ${researcher.research_subdomain ?? "—"}`,
    `Opis badań i doświadczenia: ${researcher.research_description ?? "—"}`,
    `Umiejętności praktyczne: ${skills}`,
    `Projekty: ${proj}`,
    `Dostępność: ${hours} h/tydzień, tryby: ${modes}`,
    `Motywacja współpracy z firmą: ${motivation}`,
  ];
  return clip(parts.join("\n"));
}

/** Tekst do embeddingu briefu — cel, kompetencje, zakres i oczekiwany profil. */
export function buildBriefEmbeddingText(
  content: AiBriefContent,
  raw: { industry?: string; timeline?: string; budget?: string }
): string {
  const skills = content.wymagane_kompetencje.join(", ");
  const parts = [
    `Branża: ${raw.industry ?? "—"}`,
    `Horyzont / budżet: ${raw.timeline ?? "—"} / ${raw.budget ?? "—"}`,
    `Cel R&D: ${content.cel_rd}`,
    `Wymagane kompetencje: ${skills}`,
    `Zakres projektu: ${content.zakres_projektu}`,
    `Oczekiwany rezultat: ${content.oczekiwany_rezultat}`,
    `Pierwszy milestone: ${content.pierwszy_milestone}`,
    `Sugerowany profil badacza: ${content.suggested_researcher_profile}`,
  ];
  return clip(parts.join("\n"));
}

export function buildProjectsSummaryLines(
  projects: {
    title: string;
    description: string | null;
    year_from: number | null;
    year_to: number | null;
  }[]
): string {
  if (projects.length === 0) return "Brak zapisanych projektów.";
  return projects
    .map((p) => {
      const years =
        p.year_from || p.year_to ? ` (${[p.year_from, p.year_to].filter(Boolean).join("–")})` : "";
      const desc = p.description ? `: ${p.description}` : "";
      return `${p.title}${years}${desc}`;
    })
    .join(" | ");
}
