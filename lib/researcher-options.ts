import type {
  AvailabilityMode,
  ResearchDomain,
  ResearcherProjectType,
  ResearcherStage,
} from "@/lib/validations";

export const stageOptions: { value: ResearcherStage; label: string }[] = [
  { value: "doktorant", label: "Doktorant (w trakcie)" },
  { value: "ktor", label: "Doktor (po obronie)" },
  { value: "postdoc", label: "Postdoc" },
];

export const stageLabel: Record<ResearcherStage, string> = {
  doktorant: "Doktorant",
  ktor: "Doktor",
  doktor: "Doktor",
  postdoc: "Postdoc",
};

export const researchDomainOptions: ResearchDomain[] = [
  "Inżynieria i technologia",
  "Nauki przyrodnicze",
  "Informatyka i AI",
  "Nauki medyczne i zdrowie",
  "Nauki ekonomiczne",
  "Nauki społeczne",
  "Matematyka i statystyka",
  "Chemia i materiałoznawstwo",
  "Inne",
];

export const projectTypeOptions: { value: ResearcherProjectType; label: string }[] = [
  { value: "research", label: "Projekt badawczy" },
  { value: "internship", label: "Staż w firmie" },
  { value: "consultation", label: "Zlecenie/konsultacja" },
  { value: "student_circle", label: "Koło naukowe" },
  { value: "other", label: "Inne" },
];

export const projectTypeLabel: Record<ResearcherProjectType, string> = {
  research: "Projekt badawczy",
  industry: "Współpraca z firmą",
  internship: "Staż w firmie",
  consultation: "Zlecenie/konsultacja",
  student_circle: "Koło naukowe",
  other: "Inne",
};

export const availabilityModeOptions: {
  value: AvailabilityMode;
  title: string;
  description: string;
}[] = [
  {
    value: "consultation",
    title: "Konsultacja jednorazowa",
    description:
      "Odpowiadasz na pytania, analizujesz konkretny problem (2–8h).",
  },
  {
    value: "literature_review",
    title: "Analiza literatury / ekspertyza",
    description: "Przegląd stanu wiedzy, raport (1–3 tygodnie).",
  },
  {
    value: "proof_of_concept",
    title: "Proof-of-concept",
    description: "Sprawdzasz, czy dane podejście zadziała (2–8 tygodni).",
  },
  {
    value: "small_rd_project",
    title: "Mały projekt R&D",
    description: "Realizujesz zadanie badawcze od A do Z (1–3 miesiące).",
  },
];

export const availabilityModeLabel: Record<AvailabilityMode, string> = {
  consultation: "Konsultacja jednorazowa",
  literature_review: "Analiza literatury",
  proof_of_concept: "Proof-of-concept",
  small_rd_project: "Mały projekt R&D",
};

export const skillSuggestions = [
  "Analiza danych (Python/R)",
  "Modelowanie statystyczne",
  "Przegląd literatury naukowej",
  "Projektowanie eksperymentów",
  "Symulacje numeryczne",
  "Pisanie raportów technicznych",
];
