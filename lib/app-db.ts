import { randomBytes } from "crypto";
import type { ApplicationRow } from "@/lib/application-row";
import { isLocalJsonDb } from "@/lib/db-mode";
import * as local from "@/lib/local-json-db";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase";
import type {
  AvailabilityMode,
  ResearcherProjectType,
  ResearcherRegistrationParsed,
  ResearcherStage,
} from "@/lib/validations";

/** Wiersze jak z Supabase dla /briefs i strony głównej. */
export type BriefListRow = {
  id: string;
  published_at: string | null;
  raw_input: unknown;
  final_content: unknown;
};

export async function dbListPublishedBriefs(): Promise<BriefListRow[]> {
  if (isLocalJsonDb()) {
    return local.localListPublishedBriefs();
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("briefs")
    .select("id, published_at, raw_input, final_content")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as BriefListRow[];
}

export async function dbListPublishedBriefsHomeLimit(limit: number): Promise<
  Pick<BriefListRow, "id" | "raw_input" | "final_content">[]
> {
  if (isLocalJsonDb()) {
    return local.localListPublishedBriefsLimit(limit);
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("briefs")
    .select("id, raw_input, final_content")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as Pick<BriefListRow, "id" | "raw_input" | "final_content">[];
}

export async function dbGetBriefFinalContent(id: string): Promise<unknown | null> {
  if (isLocalJsonDb()) {
    const row = await local.localGetBriefFinalContent(id);
    return row?.final_content ?? null;
  }
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("briefs")
    .select("final_content")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  return data?.final_content ?? null;
}

export type PublicBriefRow = {
  id: string;
  published_at: string | null;
  raw_input: unknown;
  final_content: unknown;
  companies: { name: string } | { name: string }[] | null;
};

export async function dbGetPublicBrief(id: string): Promise<PublicBriefRow | null> {
  if (isLocalJsonDb()) {
    const row = await local.localGetPublicBrief(id);
    if (!row) return null;
    return {
      ...row,
      companies: row.companies,
    };
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("briefs")
    .select("id, published_at, raw_input, final_content, companies(name)")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return data as PublicBriefRow;
}

export async function dbPublishBrief(args: {
  companyName: string;
  companyEmail: string;
  rawInput: Record<string, unknown>;
  finalContent: unknown;
}): Promise<{ companyId: string; briefId: string; accessToken: string } | { error: string }> {
  if (isLocalJsonDb()) {
    return local.localPublishBrief(args);
  }
  const supabase = createSupabaseServiceRoleClient();
  const email = args.companyEmail.trim().toLowerCase();
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .upsert(
      {
        name: args.companyName.trim(),
        email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    )
    .select("id")
    .single();

  if (companyError || !company) {
    return { error: companyError?.message || "company" };
  }

  const accessToken = randomBytes(24).toString("hex");

  const { data: brief, error: briefError } = await supabase
    .from("briefs")
    .insert({
      company_id: company.id,
      status: "published",
      published_at: new Date().toISOString(),
      raw_input: args.rawInput,
      final_content: args.finalContent,
      company_access_token: accessToken,
    })
    .select("id")
    .single();

  if (briefError || !brief) {
    return { error: briefError?.message || "brief" };
  }

  return {
    companyId: company.id as string,
    briefId: brief.id as string,
    accessToken,
  };
}

export type ResearcherSubmitRow = {
  id: string;
  stage: string;
  research_domain: string | null;
  research_subdomain: string | null;
  research_description: string | null;
  practical_skills: string[] | null;
  availability_hours_per_week: number | null;
  availability_modes: string[] | null;
  motivation: string | null;
};

export async function dbGetResearcherByEmailForSubmit(
  email: string
): Promise<ResearcherSubmitRow | null> {
  if (isLocalJsonDb()) {
    const r = await local.localGetResearcherByEmail(email);
    if (!r) return null;
    return {
      id: r.id,
      stage: r.stage,
      research_domain: r.research_domain,
      research_subdomain: r.research_subdomain,
      research_description: r.research_description,
      practical_skills: r.practical_skills,
      availability_hours_per_week: r.availability_hours_per_week,
      availability_modes: r.availability_modes,
      motivation: r.motivation,
    };
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("researchers")
    .select(
      "id, stage, research_domain, research_subdomain, research_description, practical_skills, availability_hours_per_week, availability_modes, motivation"
    )
    .eq("email", email)
    .maybeSingle();
  if (error || !data) return null;
  return data as ResearcherSubmitRow;
}

export async function dbGetBriefForSubmit(
  briefId: string
): Promise<{ id: string; status: string; raw_input: unknown; final_content: unknown } | null> {
  if (isLocalJsonDb()) {
    return local.localGetBriefForSubmit(briefId);
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("briefs")
    .select("id, status, raw_input, final_content")
    .eq("id", briefId)
    .maybeSingle();
  if (error || !data) return null;
  return data as {
    id: string;
    status: string;
    raw_input: unknown;
    final_content: unknown;
  };
}

export async function dbGetResearcherProjectsForSubmit(
  researcherId: string
): Promise<
  { title: string; description: string | null; type: string | null; year_from: number | null; year_to: number | null }[]
> {
  if (isLocalJsonDb()) {
    return local.localGetResearcherProjectsForSubmit(researcherId);
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("researcher_projects")
    .select("title, description, type, year_from, year_to")
    .eq("researcher_id", researcherId);
  if (error) return [];
  return (data ?? []) as {
    title: string;
    description: string | null;
    type: string | null;
    year_from: number | null;
    year_to: number | null;
  }[];
}

export async function dbInsertApplication(row: {
  briefId: string;
  researcherId: string;
  coverMessage: string;
  match_score: number;
  match_explanation: string;
  match_strengths: unknown;
  match_risks: unknown;
}): Promise<{ id: string } | { error: { code: string }; message?: string }> {
  if (isLocalJsonDb()) {
    const res = await local.localInsertApplication(row);
    if (res.ok) return { id: res.id };
    return { error: { code: res.code } };
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data: inserted, error: insErr } = await supabase
    .from("applications")
    .insert({
      brief_id: row.briefId,
      researcher_id: row.researcherId,
      cover_message: row.coverMessage.trim(),
      match_score: row.match_score,
      match_explanation: row.match_explanation,
      match_strengths: row.match_strengths,
      match_risks: row.match_risks,
      status: "pending",
    })
    .select("id")
    .single();
  if (insErr) {
    return { error: { code: insErr.code ?? "other" }, message: insErr.message };
  }
  return { id: inserted!.id as string };
}

function emptyToNull(value: string | undefined | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export async function dbRegisterResearcher(
  data: ResearcherRegistrationParsed,
  completenessScore: number
): Promise<{ researcherId: string } | { error: { code?: string; message?: string } }> {
  if (isLocalJsonDb()) {
    const researcher: Omit<local.LocalResearcher, "id"> = {
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      institution: data.institution,
      phd_start_year: data.phd_start_year,
      stage: data.stage,
      research_domain: data.research_domain,
      research_subdomain: emptyToNull(data.research_subdomain),
      research_description: data.research_description,
      practical_skills: data.practical_skills,
      availability_hours_per_week: data.availability_hours_per_week,
      availability_modes: data.availability_modes,
      motivation: data.motivation,
      publication_links: data.publication_links.length > 0 ? data.publication_links : null,
      profile_completeness: completenessScore,
    };
    const projects = data.projects
      .filter((p) => p.title.trim().length > 0)
      .map((p) => ({
        title: p.title.trim(),
        description: emptyToNull(p.description),
        type: p.type ?? null,
        year_from: p.year_from ?? null,
        year_to: p.year_to ?? null,
      }));
    const res = await local.localRegisterResearcher({ researcher, projects });
    if (res.ok) return { researcherId: res.researcherId };
    if (!res.ok && "code" in res && res.code === "23505") return { error: { code: "23505" } };
    return { error: { message: !res.ok && "message" in res ? res.message : "Błąd zapisu" } };
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data: researcher, error: researcherError } = await supabase
    .from("researchers")
    .insert({
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      institution: data.institution,
      phd_start_year: data.phd_start_year,
      stage: data.stage,
      research_domain: data.research_domain,
      research_subdomain: emptyToNull(data.research_subdomain),
      research_description: data.research_description,
      practical_skills: data.practical_skills,
      availability_hours_per_week: data.availability_hours_per_week,
      availability_modes: data.availability_modes,
      motivation: data.motivation,
      publication_links: data.publication_links.length > 0 ? data.publication_links : null,
      profile_completeness: completenessScore,
    })
    .select("id")
    .single();
  if (researcherError || !researcher) {
    if (researcherError?.code === "23505") return { error: { code: "23505" } };
    return { error: { message: researcherError?.message } };
  }
  const researcherId = researcher.id as string;
  const projectRows = data.projects
    .filter((p) => p.title.trim().length > 0)
    .map((p) => ({
      researcher_id: researcherId,
      title: p.title.trim(),
      description: emptyToNull(p.description),
      type: p.type ?? null,
      year_from: p.year_from ?? null,
      year_to: p.year_to ?? null,
    }));
  if (projectRows.length > 0) {
    const { error: projectsError } = await supabase.from("researcher_projects").insert(projectRows);
    if (projectsError) {
      await supabase.from("researchers").delete().eq("id", researcherId);
      return { error: { message: projectsError.message } };
    }
  }
  return { researcherId };
}

export async function dbGetBriefForCompany(briefId: string): Promise<{
  id: string;
  company_access_token: string | null;
  final_content: unknown;
} | null> {
  if (isLocalJsonDb()) {
    return local.localGetBriefForCompanyDashboard(briefId);
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("briefs")
    .select("id, company_access_token, final_content")
    .eq("id", briefId)
    .maybeSingle();
  if (error || !data) return null;
  return data as {
    id: string;
    company_access_token: string | null;
    final_content: unknown;
  };
}

export async function dbListApplicationsForBrief(briefId: string): Promise<ApplicationRow[] | null> {
  if (isLocalJsonDb()) {
    return local.localListApplicationsForBrief(briefId);
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data: rawApps, error } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      match_score,
      match_explanation,
      cover_message,
      match_strengths,
      match_risks,
      researchers (
        id,
        first_name,
        last_name,
        institution,
        stage,
        availability_hours_per_week,
        availability_modes
      )
    `
    )
    .eq("brief_id", briefId)
    .order("match_score", { ascending: false });
  if (error) return null;
  return (rawApps ?? []) as ApplicationRow[];
}

export async function dbVerifyBriefToken(briefId: string, token: string): Promise<boolean> {
  if (isLocalJsonDb()) {
    const b = await local.localGetBriefTokenRow(briefId);
    return Boolean(b?.company_access_token && b.company_access_token === token);
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data: brief } = await supabase
    .from("briefs")
    .select("company_access_token")
    .eq("id", briefId)
    .maybeSingle();
  return Boolean(
    brief &&
      (brief as { company_access_token: string }).company_access_token === token
  );
}

export async function dbFindApplication(
  applicationId: string,
  briefId: string
): Promise<{ id: string } | null> {
  if (isLocalJsonDb()) {
    return local.localGetApplicationBriefPair(applicationId, briefId);
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("applications")
    .select("id")
    .eq("id", applicationId)
    .eq("brief_id", briefId)
    .maybeSingle();
  return data as { id: string } | null;
}

export async function dbUpdateApplicationStatus(applicationId: string, status: string): Promise<void> {
  if (isLocalJsonDb()) {
    await local.localUpdateApplicationStatus(applicationId, status);
    return;
  }
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("applications").update({ status }).eq("id", applicationId);
  if (error) throw new Error(error.message);
}

export type ResearcherProfileRow = {
  id: string;
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
  availability_modes: AvailabilityMode[] | null;
  motivation: string | null;
  publication_links: string[] | null;
  profile_completeness: number | null;
};

export type ResearcherProjectProfileRow = {
  id: string;
  title: string;
  description: string | null;
  type: ResearcherProjectType | null;
  year_from: number | null;
  year_to: number | null;
};

export async function dbGetResearcherProfile(
  id: string
): Promise<ResearcherProfileRow | null> {
  if (isLocalJsonDb()) {
    const r = await local.localGetResearcherProfile(id);
    return r as ResearcherProfileRow | null;
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("researchers")
    .select(
      "id, first_name, last_name, institution, phd_start_year, stage, research_domain, research_subdomain, research_description, practical_skills, availability_hours_per_week, availability_modes, motivation, publication_links, profile_completeness"
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as ResearcherProfileRow;
}

export async function dbListResearcherProjectsProfile(
  researcherId: string
): Promise<ResearcherProjectProfileRow[]> {
  if (isLocalJsonDb()) {
    const rows = await local.localListResearcherProjectsProfile(researcherId);
    return rows as ResearcherProjectProfileRow[];
  }
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("researcher_projects")
    .select("id, title, description, type, year_from, year_to")
    .eq("researcher_id", researcherId)
    .order("year_to", { ascending: false, nullsFirst: false });
  return (data ?? []) as ResearcherProjectProfileRow[];
}

export async function dbHealthCheckLocal(): Promise<boolean> {
  if (!isLocalJsonDb()) return false;
  try {
    return await local.localPing();
  } catch {
    return false;
  }
}
