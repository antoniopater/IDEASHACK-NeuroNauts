export type ApplicationResearcherEmbed = {
  id: string;
  first_name: string;
  last_name: string;
  institution: string;
  stage: string;
  availability_hours_per_week: number | null;
  availability_modes: string[] | null;
};

export type ApplicationRow = {
  id: string;
  status: string;
  match_score: number | null;
  match_explanation: string | null;
  cover_message: string | null;
  match_strengths: unknown;
  match_risks: unknown;
  researchers: ApplicationResearcherEmbed | ApplicationResearcherEmbed[] | null;
};
