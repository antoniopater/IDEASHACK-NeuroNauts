import type {
  AvailabilityMode,
  ResearchDomain,
  ResearcherProjectType,
  ResearcherStage,
} from "@/lib/validations";

export const stageOptions: { value: ResearcherStage; label: string }[] = [
  { value: "doktorant", label: "PhD Student (in progress)" },
  { value: "ktor", label: "PhD (post-defense)" },
  { value: "postdoc", label: "Postdoc" },
];

export const stageLabel: Record<ResearcherStage, string> = {
  doktorant: "PhD Student",
  ktor: "PhD",
  doktor: "PhD",
  postdoc: "Postdoc",
};

export const researchDomainOptions: ResearchDomain[] = [
  "Engineering & Technology",
  "Natural Sciences",
  "Computer Science & AI",
  "Medical Sciences & Health",
  "Economics & Business",
  "Social Sciences",
  "Mathematics & Statistics",
  "Chemistry & Materials Science",
  "Other",
];

export const projectTypeOptions: { value: ResearcherProjectType; label: string }[] = [
  { value: "research", label: "Research project" },
  { value: "industry", label: "Industry collaboration" },
  { value: "internship", label: "Company internship" },
  { value: "consultation", label: "Consultation / freelance" },
  { value: "student_circle", label: "Student research circle" },
  { value: "other", label: "Other" },
];

export const projectTypeLabel: Record<ResearcherProjectType, string> = {
  research: "Research project",
  industry: "Industry collaboration",
  internship: "Company internship",
  consultation: "Consultation",
  student_circle: "Student research circle",
  other: "Other",
};

export const availabilityModeOptions: {
  value: AvailabilityMode;
  title: string;
  description: string;
}[] = [
  {
    value: "consultation",
    title: "One-off consultation",
    description: "Answer specific questions, analyze a concrete problem (2-8h).",
  },
  {
    value: "literature_review",
    title: "Literature review / expert report",
    description: "State-of-the-art review, written report (1-3 weeks).",
  },
  {
    value: "proof_of_concept",
    title: "Proof of concept",
    description: "Validate whether a given approach works (2-8 weeks).",
  },
  {
    value: "small_rd_project",
    title: "Small R&D project",
    description: "End-to-end research task delivery (1-3 months).",
  },
];

export const availabilityModeLabel: Record<AvailabilityMode, string> = {
  consultation: "One-off consultation",
  literature_review: "Literature review",
  proof_of_concept: "Proof of concept",
  small_rd_project: "Small R&D project",
};

export const skillSuggestions = [
  "Data analysis (Python/R)",
  "Statistical modelling",
  "Scientific literature review",
  "Experimental design",
  "Numerical simulations",
  "Technical report writing",
];
