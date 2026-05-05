import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  industry: z.string().optional(),
  email: z.string().email("Podaj poprawny adres e-mail"),
});
export type CompanyInput = z.infer<typeof companySchema>;

export const briefStatusSchema = z.enum(["draft", "published", "closed"]);

export const briefSchema = z.object({
  company_id: z.string().uuid(),
  status: briefStatusSchema.default("draft"),
  raw_input: z.record(z.string(), z.unknown()),
  ai_output: z.record(z.string(), z.unknown()).optional(),
  final_content: z.record(z.string(), z.unknown()).optional(),
});
export type BriefInput = z.infer<typeof briefSchema>;

export const researcherStageSchema = z.enum(["doktorant", "ktor", "doktor", "postdoc"]);
export type ResearcherStage = z.infer<typeof researcherStageSchema>;

export const researchDomainSchema = z.enum([
  "Inżynieria i technologia",
  "Nauki przyrodnicze",
  "Informatyka i AI",
  "Nauki medyczne i zdrowie",
  "Nauki ekonomiczne",
  "Nauki społeczne",
  "Matematyka i statystyka",
  "Chemia i materiałoznawstwo",
  "Inne",
]);
export type ResearchDomain = z.infer<typeof researchDomainSchema>;

export const availabilityModeSchema = z.enum([
  "consultation",
  "literature_review",
  "proof_of_concept",
  "small_rd_project",
]);
export type AvailabilityMode = z.infer<typeof availabilityModeSchema>;

export const researcherProjectTypeSchema = z.enum([
  "research",
  "industry",
  "internship",
  "consultation",
  "student_circle",
  "other",
]);
export type ResearcherProjectType = z.infer<typeof researcherProjectTypeSchema>;

const currentYear = new Date().getFullYear();

export const researcherProjectInputSchema = z
  .object({
    title: z.string().trim().min(1, "Tytuł projektu jest wymagany"),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    type: researcherProjectTypeSchema.optional(),
    year_from: z.number().int().min(1980).max(currentYear + 1).optional(),
    year_to: z.number().int().min(1980).max(currentYear + 5).optional(),
  })
  .refine(
    (p) => p.year_from == null || p.year_to == null || p.year_to >= p.year_from,
    { message: "Rok zakończenia musi być po roku rozpoczęcia", path: ["year_to"] }
  );
export type ResearcherProjectInput = z.infer<typeof researcherProjectInputSchema>;

export const researcherProjectSchema = z.object({
  researcher_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: researcherProjectTypeSchema.optional(),
  year_from: z.number().int().min(1900).max(2100).optional(),
  year_to: z.number().int().min(1900).max(2100).optional(),
});
export type ResearcherProjectRow = z.infer<typeof researcherProjectSchema>;

export const researcherRegistrationSchema = z.object({
  first_name: z.string().trim().min(1, "Imię jest wymagane").max(80),
  last_name: z.string().trim().min(1, "Nazwisko jest wymagane").max(80),
  email: z.string().trim().toLowerCase().email("Podaj poprawny adres email"),
  institution: z
    .string()
    .trim()
    .min(2, "Podaj nazwę uczelni lub instytutu")
    .max(200),
  phd_start_year: z.number().int().min(2010, "Najwcześniej rok 2010").max(currentYear, `Najpóźniej rok ${currentYear}`),
  stage: researcherStageSchema,

  research_domain: researchDomainSchema,
  research_subdomain: z.string().trim().max(120).optional().or(z.literal("")),
  research_description: z
    .string()
    .trim()
    .min(80, "Opis musi mieć co najmniej 80 znaków")
    .max(4000),

  practical_skills: z
    .array(z.string().trim().min(1).max(80))
    .min(3, "Dodaj co najmniej 3 umiejętności")
    .max(20, "Maksymalnie 20 umiejętności"),

  projects: z
    .array(researcherProjectInputSchema)
    .min(1, "Dodaj przynajmniej jeden projekt")
    .max(6, "Maksymalnie 6 projektów"),

  availability_hours_per_week: z.number().int().min(4).max(40),
  availability_modes: z
    .array(availabilityModeSchema)
    .min(1, "Wybierz przynajmniej jedną formę współpracy"),

  motivation: z
    .string()
    .trim()
    .min(100, "Motywacja musi mieć co najmniej 100 znaków")
    .max(600, "Maksymalnie 600 znaków"),

  publication_links: z
    .array(z.string().trim().url("Podaj poprawny URL").or(z.literal("")))
    .max(10)
    .optional()
    .transform((arr) => (arr ?? []).filter((u): u is string => Boolean(u && u.length > 0))),
});
export type ResearcherRegistrationInput = z.input<typeof researcherRegistrationSchema>;
export type ResearcherRegistrationParsed = z.output<typeof researcherRegistrationSchema>;

export const researcherSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  institution: z.string().min(1),
  phd_start_year: z.number().int().min(1900).max(2100).optional(),
  stage: researcherStageSchema,
  research_domain: z.string().optional(),
  research_subdomain: z.string().optional(),
  research_description: z.string().optional(),
  practical_skills: z.array(z.string()).optional(),
  availability_hours_per_week: z.number().int().min(0).max(168).optional(),
  availability_modes: z.array(z.string()).optional(),
  motivation: z.string().optional(),
  publication_links: z.array(z.string().url()).optional(),
});
export type ResearcherInput = z.infer<typeof researcherSchema>;

export const applicationStatusSchema = z.enum(["pending", "shortlisted", "rejected"]);

export const applicationSchema = z.object({
  brief_id: z.string().uuid(),
  researcher_id: z.string().uuid(),
  match_score: z.number().min(0).max(1).optional(),
  match_explanation: z.string().optional(),
  status: applicationStatusSchema.default("pending"),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;

/* ——— Briefy R&D (formularz firmy + API) ——— */

export const industryOptions = [
  "Produkcja przemysłowa",
  "Farmaceutyka i biotech",
  "Energetyka i OZE",
  "IT i oprogramowanie",
  "Chemia i materiały",
  "Rolnictwo i żywność",
  "Transport i logistyka",
  "Medycyna i health tech",
  "Fintech",
  "Inne",
] as const;

export const timelineOptions = [
  "1–4 tygodnie",
  "1–3 miesiące",
  "3–6 miesięcy",
  "6–12 miesięcy",
] as const;

export const budgetOptions = [
  "Do 5 000 zł",
  "5 000–20 000 zł",
  "20 000–50 000 zł",
  "Powyżej 50 000 zł",
  "Do ustalenia",
] as const;

export const generateBriefInputSchema = z.object({
  problem: z.string().min(50, "Opis problemu musi mieć co najmniej 50 znaków."),
  industry: z.string().min(1, "Wybierz branżę."),
  timeline: z.string().min(1, "Wybierz horyzont czasowy."),
  budget: z.string().min(1, "Wybierz budżet."),
  expected_result: z.string().optional().default(""),
});
export type GenerateBriefInput = z.infer<typeof generateBriefInputSchema>;

export const aiBriefResponseSchema = z.object({
  cel_rd: z.string(),
  wymagane_kompetencje: z.array(z.string()),
  zakres_projektu: z.string(),
  oczekiwany_rezultat: z.string(),
  pierwszy_milestone: z.string(),
  suggested_researcher_profile: z.string(),
});
export type AiBriefContent = z.infer<typeof aiBriefResponseSchema>;

export const rawInputSchema = z.object({
  problem: z.string(),
  industry: z.string(),
  timeline: z.string(),
  budget: z.string(),
  expected_result: z.string().optional().default(""),
});

export const publishBriefBodySchema = z.object({
  companyName: z.string().min(1, "Podaj nazwę firmy."),
  companyEmail: z.string().email("Podaj poprawny adres e-mail."),
  rawInput: rawInputSchema,
  finalContent: aiBriefResponseSchema,
});
export type PublishBriefBody = z.infer<typeof publishBriefBodySchema>;

/** Treść zgłoszenia badacza (POST /api/applications/submit) */
export const applicationSubmitSchema = z.object({
  briefId: z.string().uuid(),
  researcherEmail: z.string().email("Podaj poprawny adres e-mail."),
  coverMessage: z.string().min(100).max(800),
  confirmed: z
    .boolean()
    .refine((v) => v === true, { message: "Musisz potwierdzić zapoznanie z briefem." }),
});
export type ApplicationSubmitInput = z.infer<typeof applicationSubmitSchema>;

/** Odpowiedź modelu dopasowania (JSON) */
export const matchResponseSchema = z.object({
  score: z.number().min(0).max(100),
  explanation: z.string(),
  strengths: z.array(z.string()),
  risks: z.array(z.string()),
});
export type MatchResponse = z.infer<typeof matchResponseSchema>;
