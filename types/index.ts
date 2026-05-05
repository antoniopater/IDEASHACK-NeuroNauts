export type BriefStatus = "draft" | "published" | "closed";
export type ResearcherStage = "doktorant" | "ktor" | "doktor" | "postdoc";
export type ResearcherProjectType =
  | "research"
  | "industry"
  | "internship"
  | "consultation"
  | "student_circle"
  | "other";
export type AvailabilityMode =
  | "consultation"
  | "literature_review"
  | "proof_of_concept"
  | "small_rd_project";
export type ApplicationStatus = "pending" | "shortlisted" | "rejected";

export interface Company {
  id: string;
  name: string;
  industry: string | null;
  email: string;
  created_at: string;
}

export interface Brief {
  id: string;
  company_id: string;
  status: BriefStatus;
  raw_input: Record<string, unknown>;
  ai_output: Record<string, unknown> | null;
  final_content: Record<string, unknown> | null;
  created_at: string;
  published_at: string | null;
}

export interface Researcher {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  institution: string;
  phd_start_year: number | null;
  stage: ResearcherStage;
  research_domain: string | null;
  research_subdomain: string | null;
  research_description: string | null;
  practical_skills: string[] | null;
  availability_hours_per_week: number | null;
  availability_modes: string[] | null;
  motivation: string | null;
  publication_links: string[] | null;
  profile_completeness: number;
  created_at: string;
}

export interface ResearcherProject {
  id: string;
  researcher_id: string;
  title: string;
  description: string | null;
  type: ResearcherProjectType | null;
  year_from: number | null;
  year_to: number | null;
  created_at: string;
}

export interface Application {
  id: string;
  brief_id: string;
  researcher_id: string;
  match_score: number | null;
  match_explanation: string | null;
  status: ApplicationStatus;
  created_at: string;
}
