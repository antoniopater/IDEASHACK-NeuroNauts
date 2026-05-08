import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Name is required"),
  industry: z.string().optional(),
  email: z.string().email("Enter a valid email address"),
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
  "Engineering & Technology",
  "Natural Sciences",
  "Computer Science & AI",
  "Medical Sciences & Health",
  "Economics & Business",
  "Social Sciences",
  "Mathematics & Statistics",
  "Chemistry & Materials Science",
  "Other",
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
    title: z.string().trim().min(1, "Project title is required"),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    type: z.preprocess(
      (value) => (value === "" ? undefined : value),
      researcherProjectTypeSchema.optional()
    ),
    year_from: z.number().int().min(1980).max(currentYear + 1).optional(),
    year_to: z.number().int().min(1980).max(currentYear + 5).optional(),
  })
  .refine(
    (p) => p.year_from == null || p.year_to == null || p.year_to >= p.year_from,
    { message: "End year must be after start year", path: ["year_to"] }
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
  first_name: z.string().trim().min(1, "First name is required").max(80),
  last_name: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  institution: z
    .string()
    .trim()
    .min(2, "Enter the university or institute name")
    .max(200),
  phd_start_year: z.number().int().min(2010, "Earliest allowed year is 2010").max(currentYear, `Latest allowed year ${currentYear}`),
  stage: researcherStageSchema,

  research_domain: researchDomainSchema,
  research_subdomain: z.string().trim().max(120).optional().or(z.literal("")),
  research_description: z
    .string()
    .trim()
    .min(80, "Description must be at least 80 characters")
    .max(4000),

  practical_skills: z
    .array(z.string().trim().min(1).max(80))
    .min(3, "Add at least 3 skills")
    .max(20, "Maximum 20 skills"),

  projects: z
    .array(researcherProjectInputSchema)
    .min(1, "Add at least one project")
    .max(6, "Maximum 6 projects"),

  availability_hours_per_week: z.number().int().min(4).max(40),
  availability_modes: z
    .array(availabilityModeSchema)
    .min(1, "Select at least one collaboration mode"),

  motivation: z
    .string()
    .trim()
    .min(100, "Motivation must be at least 100 characters")
    .max(600, "Maximum 600 characters"),

  publication_links: z
    .array(z.string().trim().url("Enter a valid URL").or(z.literal("")))
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
  match_score: z.number().min(0).max(100).optional(),
  match_explanation: z.string().optional(),
  status: applicationStatusSchema.default("pending"),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;

/* --- R&D briefs (company form + API) --- */

export const industryOptions = [
  "Industrial Manufacturing",
  "Pharmaceuticals & Biotech",
  "Energy & Renewables",
  "IT & Software",
  "Chemistry & Materials",
  "Agriculture & Food",
  "Transport & Logistics",
  "Medicine & HealthTech",
  "FinTech",
  "Other",
] as const;

export const timelineOptions = [
  "1-4 weeks",
  "1-3 months",
  "3-6 months",
  "6-12 months",
] as const;

export const budgetOptions = [
  "Under PLN 5,000",
  "PLN 5,000-20,000",
  "PLN 20,000-50,000",
  "Over PLN 50,000",
  "Open to discuss",
] as const;

export const generateBriefInputSchema = z.object({
  problem: z.string().min(50, "Problem description must be at least 50 characters."),
  industry: z.string().min(1, "Please select an industry."),
  timeline: z.string().min(1, "Please select a timeline."),
  budget: z.string().min(1, "Please select a budget."),
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
  companyName: z.string().min(1, "Enter the company name."),
  companyEmail: z.string().email("Enter a valid email address."),
  rawInput: rawInputSchema,
  finalContent: aiBriefResponseSchema,
});
export type PublishBriefBody = z.infer<typeof publishBriefBodySchema>;

/** Researcher application payload (POST /api/applications/submit) */
export const applicationSubmitSchema = z.object({
  briefId: z.string().uuid(),
  coverMessage: z.string().min(100).max(800),
  confirmed: z
    .boolean()
    .refine((v) => v === true, { message: "You must confirm that you have reviewed the brief." }),
});
export type ApplicationSubmitInput = z.infer<typeof applicationSubmitSchema>;

/** Matching model response (JSON) */
export const matchDimensionSchema = z.object({
  score: z.number().min(0).max(100),
  rationale: z.string(),
});

export const matchResponseSchema = z.object({
  score: z.number().min(0).max(100),
  explanation: z.string(),
  strengths: z.array(z.string()),
  risks: z.array(z.string()),
  dimensions: z
    .object({
      domain_fit: matchDimensionSchema,
      skills_fit: matchDimensionSchema,
      availability_fit: matchDimensionSchema,
      motivation_fit: matchDimensionSchema,
    })
    .optional(),
});
export type MatchResponse = z.infer<typeof matchResponseSchema>;

export const profileBuilderProjectSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(20).max(1200).optional().or(z.literal("")),
  type: z.preprocess(
    (value) => (value === "" ? undefined : value),
    researcherProjectTypeSchema.optional()
  ),
  year_from: z.number().int().min(1980).max(currentYear + 1).optional(),
  year_to: z.number().int().min(1980).max(currentYear + 5).optional(),
});

export const profileBuilderInputSchema = z.object({
  rawText: z.string().trim().min(80, "Paste at least 80 characters of profile description."),
  stage: researcherStageSchema.optional(),
  research_domain: researchDomainSchema.optional(),
  publication_links: z
    .array(z.string().trim().url("Enter a valid URL").or(z.literal("")))
    .max(10)
    .optional()
    .transform((arr) => (arr ?? []).filter((u): u is string => Boolean(u && u.length > 0))),
});
export type ProfileBuilderInput = z.input<typeof profileBuilderInputSchema>;

export const profileBuilderResponseSchema = z.object({
  research_subdomain: z.string().trim().max(120).optional().or(z.literal("")),
  research_description: z.string().trim().min(80).max(4000),
  practical_skills: z.array(z.string().trim().min(1).max(80)).min(3).max(12),
  projects: z.array(profileBuilderProjectSchema).min(1).max(4),
  motivation: z.string().trim().min(100).max(600),
  publication_links: z.array(z.string().trim().url()).max(10).optional().default([]),
});
export type ProfileBuilderResponse = z.infer<typeof profileBuilderResponseSchema>;
