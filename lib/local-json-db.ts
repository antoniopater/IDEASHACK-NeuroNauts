import { randomBytes, randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import type { ApplicationRow } from "@/lib/application-row";

const DATA_PATH = join(process.cwd(), "data", "local-db.json");

export type LocalCompany = {
  id: string;
  name: string;
  email: string;
  updated_at: string;
  industry?: string | null;
};

export type LocalBrief = {
  id: string;
  company_id: string;
  status: string;
  published_at: string | null;
  raw_input: Record<string, unknown>;
  final_content: unknown;
  company_access_token: string | null;
};

export type LocalResearcher = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  institution: string;
  phd_start_year: number | null;
  stage: string;
  research_domain: string | null;
  research_subdomain: string | null;
  research_description: string | null;
  practical_skills: string[] | null;
  availability_hours_per_week: number | null;
  availability_modes: string[] | null;
  motivation: string | null;
  publication_links: string[] | null;
  profile_completeness: number | null;
};

export type LocalResearcherProject = {
  id: string;
  researcher_id: string;
  title: string;
  description: string | null;
  type: string | null;
  year_from: number | null;
  year_to: number | null;
};

export type LocalApplication = {
  id: string;
  brief_id: string;
  researcher_id: string;
  cover_message: string | null;
  match_score: number | null;
  match_explanation: string | null;
  match_strengths: unknown;
  match_risks: unknown;
  match_dimensions?: unknown;
  status: string;
};

export type LocalUserRole = "company" | "researcher";

export type LocalUser = {
  id: string;
  email: string;
  password_hash: string;
  role: LocalUserRole;
  institution_name: string | null;
  institution_verified: boolean;
  company_id: string | null;
  researcher_id: string | null;
  created_at: string;
};

type Store = {
  companies: LocalCompany[];
  briefs: LocalBrief[];
  researchers: LocalResearcher[];
  researcher_projects: LocalResearcherProject[];
  applications: LocalApplication[];
  users: LocalUser[];
};

function emptyStore(): Store {
  return {
    companies: [],
    briefs: [],
    researchers: [],
    researcher_projects: [],
    applications: [],
    users: [],
  };
}

function normalizeStore(raw: unknown): Store {
  if (!raw || typeof raw !== "object") return emptyStore();
  const o = raw as Record<string, unknown>;
  return {
    companies: Array.isArray(o.companies) ? (o.companies as LocalCompany[]) : [],
    briefs: Array.isArray(o.briefs) ? (o.briefs as LocalBrief[]) : [],
    researchers: Array.isArray(o.researchers) ? (o.researchers as LocalResearcher[]) : [],
    researcher_projects: Array.isArray(o.researcher_projects)
      ? (o.researcher_projects as LocalResearcherProject[])
      : [],
    applications: Array.isArray(o.applications) ? (o.applications as LocalApplication[]) : [],
    users: Array.isArray(o.users) ? (o.users as LocalUser[]) : [],
  };
}

async function ensureDataDir(): Promise<void> {
  await mkdir(dirname(DATA_PATH), { recursive: true });
}

async function loadStore(): Promise<Store> {
  await ensureDataDir();
  try {
    const raw = await readFile(DATA_PATH, "utf-8");
    return normalizeStore(JSON.parse(raw));
  } catch {
    return emptyStore();
  }
}

async function saveStore(store: Store): Promise<void> {
  await ensureDataDir();
  await writeFile(DATA_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf-8");
}

let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(() => fn());
  chain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export async function localPing(): Promise<boolean> {
  return enqueue(async () => {
    await loadStore();
    return true;
  });
}

/** Lista briefów opublikowanych (jak select dla /briefs). */
export async function localListPublishedBriefs(): Promise<
  Pick<LocalBrief, "id" | "published_at" | "raw_input" | "final_content">[]
> {
  return enqueue(async () => {
    const store = await loadStore();
    return store.briefs
      .filter((b) => b.status === "published")
      .sort((a, b) => {
        const ta = a.published_at ? Date.parse(a.published_at) : 0;
        const tb = b.published_at ? Date.parse(b.published_at) : 0;
        return tb - ta;
      })
      .map((b) => ({
        id: b.id,
        published_at: b.published_at,
        raw_input: b.raw_input,
        final_content: b.final_content,
      }));
  });
}

export async function localListPublishedBriefsLimit(
  limit: number
): Promise<Pick<LocalBrief, "id" | "raw_input" | "final_content">[]> {
  const rows = await localListPublishedBriefs();
  return rows.slice(0, limit).map((r) => ({
    id: r.id,
    raw_input: r.raw_input,
    final_content: r.final_content,
  }));
}

export async function localGetBriefFinalContent(
  id: string
): Promise<{ final_content: unknown } | null> {
  return enqueue(async () => {
    const store = await loadStore();
    const b = store.briefs.find((x) => x.id === id && x.status === "published");
    if (!b) return null;
    return { final_content: b.final_content };
  });
}

export type PublicBriefRow = {
  id: string;
  published_at: string | null;
  raw_input: Record<string, unknown>;
  final_content: unknown;
  companies: { name: string } | null;
};

export async function localGetPublicBrief(id: string): Promise<PublicBriefRow | null> {
  return enqueue(async () => {
    const store = await loadStore();
    const b = store.briefs.find((x) => x.id === id && x.status === "published");
    if (!b) return null;
    const company = store.companies.find((c) => c.id === b.company_id);
    return {
      id: b.id,
      published_at: b.published_at,
      raw_input: b.raw_input,
      final_content: b.final_content,
      companies: company ? { name: company.name } : null,
    };
  });
}

export async function localPublishBrief(args: {
  companyName: string;
  companyEmail: string;
  rawInput: Record<string, unknown>;
  finalContent: unknown;
}): Promise<{ companyId: string; briefId: string; accessToken: string } | { error: string }> {
  return enqueue(async () => {
    const store = await loadStore();
    const email = args.companyEmail.trim().toLowerCase();
    let company = store.companies.find((c) => c.email === email);
    const now = new Date().toISOString();
    if (company) {
      company.name = args.companyName.trim();
      company.updated_at = now;
    } else {
      company = {
        id: randomUUID(),
        name: args.companyName.trim(),
        email,
        updated_at: now,
        industry: null,
      };
      store.companies.push(company);
    }

    const accessToken = randomBytes(24).toString("hex");
    const brief: LocalBrief = {
      id: randomUUID(),
      company_id: company.id,
      status: "published",
      published_at: now,
      raw_input: args.rawInput,
      final_content: args.finalContent,
      company_access_token: accessToken,
    };
    store.briefs.push(brief);
    await saveStore(store);
    return { companyId: company.id, briefId: brief.id, accessToken };
  });
}

export async function localGetResearcherByEmail(
  email: string
): Promise<Omit<LocalResearcher, "email"> & { email: string } | null> {
  return enqueue(async () => {
    const store = await loadStore();
    const r = store.researchers.find((x) => x.email === email);
    return r ?? null;
  });
}

export async function localCreateUser(args: {
  email: string;
  passwordHash: string;
  role: LocalUserRole;
  institutionName: string | null;
  institutionVerified: boolean;
}): Promise<{ ok: true; userId: string } | { ok: false; code: "23505" }> {
  return enqueue(async () => {
    const store = await loadStore();
    const email = args.email.trim().toLowerCase();
    if (store.users.some((u) => u.email === email)) {
      return { ok: false, code: "23505" };
    }
    const now = new Date().toISOString();
    const user: LocalUser = {
      id: randomUUID(),
      email,
      password_hash: args.passwordHash,
      role: args.role,
      institution_name: args.institutionName,
      institution_verified: args.institutionVerified,
      company_id: null,
      researcher_id: null,
      created_at: now,
    };
    store.users.push(user);
    await saveStore(store);
    return { ok: true, userId: user.id };
  });
}

export async function localGetUserByEmail(email: string): Promise<LocalUser | null> {
  return enqueue(async () => {
    const store = await loadStore();
    return store.users.find((u) => u.email === email.trim().toLowerCase()) ?? null;
  });
}

export async function localGetUserById(id: string): Promise<LocalUser | null> {
  return enqueue(async () => {
    const store = await loadStore();
    return store.users.find((u) => u.id === id) ?? null;
  });
}

export async function localLinkUserResearcher(userId: string, researcherId: string): Promise<void> {
  return enqueue(async () => {
    const store = await loadStore();
    const user = store.users.find((u) => u.id === userId);
    if (user) {
      user.researcher_id = researcherId;
    }
    await saveStore(store);
  });
}

export async function localLinkUserCompany(userId: string, companyId: string): Promise<void> {
  return enqueue(async () => {
    const store = await loadStore();
    const user = store.users.find((u) => u.id === userId);
    if (user) {
      user.company_id = companyId;
    }
    await saveStore(store);
  });
}

export async function localGetBriefForSubmit(
  briefId: string
): Promise<Pick<LocalBrief, "id" | "status" | "raw_input" | "final_content"> | null> {
  return enqueue(async () => {
    const store = await loadStore();
    const b = store.briefs.find((x) => x.id === briefId);
    if (!b) return null;
    return {
      id: b.id,
      status: b.status,
      raw_input: b.raw_input,
      final_content: b.final_content,
    };
  });
}

export async function localGetResearcherProjectsForSubmit(
  researcherId: string
): Promise<Pick<LocalResearcherProject, "title" | "description" | "type" | "year_from" | "year_to">[]> {
  return enqueue(async () => {
    const store = await loadStore();
    return store.researcher_projects
      .filter((p) => p.researcher_id === researcherId)
      .map((p) => ({
        title: p.title,
        description: p.description,
        type: p.type,
        year_from: p.year_from,
        year_to: p.year_to,
      }));
  });
}

export type InsertApplicationResult =
  | { ok: true; id: string }
  | { ok: false; code: "23505" }
  | { ok: false; code: "other"; message?: string };

export async function localInsertApplication(row: {
  briefId: string;
  researcherId: string;
  coverMessage: string;
  match_score: number;
  match_explanation: string;
  match_strengths: unknown;
  match_risks: unknown;
  match_dimensions?: unknown;
}): Promise<InsertApplicationResult> {
  return enqueue(async () => {
    const store = await loadStore();
    const dup = store.applications.some(
      (a) => a.brief_id === row.briefId && a.researcher_id === row.researcherId
    );
    if (dup) return { ok: false, code: "23505" };
    const id = randomUUID();
    store.applications.push({
      id,
      brief_id: row.briefId,
      researcher_id: row.researcherId,
      cover_message: row.coverMessage,
      match_score: row.match_score,
      match_explanation: row.match_explanation,
      match_strengths: row.match_strengths,
      match_risks: row.match_risks,
      match_dimensions: row.match_dimensions ?? null,
      status: "pending",
    });
    await saveStore(store);
    return { ok: true, id };
  });
}

export type RegisterResearcherResult =
  | { ok: true; researcherId: string }
  | { ok: false; code: "23505" }
  | { ok: false; message: string };

export async function localRegisterResearcher(args: {
  researcher: Omit<LocalResearcher, "id">;
  projects: Omit<LocalResearcherProject, "id" | "researcher_id">[];
}): Promise<RegisterResearcherResult> {
  return enqueue(async () => {
    const store = await loadStore();
    const email = args.researcher.email.trim().toLowerCase();
    if (store.researchers.some((r) => r.email === email)) {
      return { ok: false, code: "23505" };
    }
    const researcherId = randomUUID();
    const researcher: LocalResearcher = { ...args.researcher, email, id: researcherId };
    store.researchers.push(researcher);

    for (const p of args.projects) {
      if (!p.title?.trim()) continue;
      store.researcher_projects.push({
        id: randomUUID(),
        researcher_id: researcherId,
        title: p.title.trim(),
        description: p.description ?? null,
        type: p.type ?? null,
        year_from: p.year_from ?? null,
        year_to: p.year_to ?? null,
      });
    }

    await saveStore(store);
    return { ok: true, researcherId };
  });
}

export async function localGetBriefForCompanyDashboard(
  briefId: string
): Promise<Pick<LocalBrief, "id" | "company_id" | "company_access_token" | "final_content"> | null> {
  return enqueue(async () => {
    const store = await loadStore();
    const b = store.briefs.find((x) => x.id === briefId);
    if (!b) return null;
    return {
      id: b.id,
      company_id: b.company_id,
      company_access_token: b.company_access_token,
      final_content: b.final_content,
    };
  });
}

export async function localListApplicationsForBrief(briefId: string): Promise<ApplicationRow[]> {
  return enqueue(async () => {
    const store = await loadStore();
    const apps = store.applications
      .filter((a) => a.brief_id === briefId)
      .sort((a, b) => (b.match_score ?? -1) - (a.match_score ?? -1));

    return apps.map((a) => {
      const r = store.researchers.find((x) => x.id === a.researcher_id);
      const embed = r
        ? {
            id: r.id,
            first_name: r.first_name,
            last_name: r.last_name,
            institution: r.institution,
            stage: r.stage,
            availability_hours_per_week: r.availability_hours_per_week,
            availability_modes: r.availability_modes,
          }
        : null;
      return {
        id: a.id,
        status: a.status,
        match_score: a.match_score,
        match_explanation: a.match_explanation,
        cover_message: a.cover_message,
        match_strengths: a.match_strengths,
        match_risks: a.match_risks,
        match_dimensions: a.match_dimensions ?? null,
        researchers: embed,
      };
    });
  });
}

export async function localListApplicationsForResearcher(researcherId: string): Promise<
  {
    id: string;
    brief_id: string;
    status: string;
    match_score: number | null;
    match_explanation: string | null;
    created_at: string | null;
    briefs: { raw_input: unknown; final_content: unknown } | null;
  }[]
> {
  return enqueue(async () => {
    const store = await loadStore();
    return store.applications
      .filter((a) => a.researcher_id === researcherId)
      .sort((a, b) => (b.match_score ?? -1) - (a.match_score ?? -1))
      .map((a) => {
        const brief = store.briefs.find((b) => b.id === a.brief_id);
        return {
          id: a.id,
          brief_id: a.brief_id,
          status: a.status,
          match_score: a.match_score,
          match_explanation: a.match_explanation,
          created_at: null,
          briefs: brief
            ? { raw_input: brief.raw_input, final_content: brief.final_content }
            : null,
        };
      });
  });
}

export async function localGetBriefTokenRow(
  briefId: string
): Promise<Pick<LocalBrief, "id" | "company_access_token"> | null> {
  return enqueue(async () => {
    const store = await loadStore();
    const b = store.briefs.find((x) => x.id === briefId);
    if (!b) return null;
    return { id: b.id, company_access_token: b.company_access_token };
  });
}

export async function localGetApplicationBriefPair(
  applicationId: string,
  briefId: string
): Promise<{ id: string } | null> {
  return enqueue(async () => {
    const store = await loadStore();
    const a = store.applications.find((x) => x.id === applicationId && x.brief_id === briefId);
    return a ? { id: a.id } : null;
  });
}

export async function localUpdateApplicationStatus(
  applicationId: string,
  status: string
): Promise<void> {
  return enqueue(async () => {
    const store = await loadStore();
    const a = store.applications.find((x) => x.id === applicationId);
    if (a) a.status = status;
    await saveStore(store);
  });
}

export async function localGetResearcherProfile(
  id: string
): Promise<LocalResearcher | null> {
  return enqueue(async () => {
    const store = await loadStore();
    return store.researchers.find((r) => r.id === id) ?? null;
  });
}

export async function localListResearcherProjectsProfile(
  researcherId: string
): Promise<LocalResearcherProject[]> {
  return enqueue(async () => {
    const store = await loadStore();
    return store.researcher_projects
      .filter((p) => p.researcher_id === researcherId)
      .sort((a, b) => (b.year_to ?? 0) - (a.year_to ?? 0));
  });
}

export async function localGetAllResearchers(): Promise<LocalResearcher[]> {
  return enqueue(async () => {
    const store = await loadStore();
    return [...store.researchers].sort((a, b) =>
      (b.profile_completeness ?? 0) - (a.profile_completeness ?? 0)
    );
  });
}

export async function localGetBriefsByCompanyId(
  companyId: string
): Promise<LocalBrief[]> {
  return enqueue(async () => {
    const store = await loadStore();
    return store.briefs
      .filter((b) => b.company_id === companyId)
      .sort((a, b) => {
        const ta = a.published_at ? Date.parse(a.published_at) : 0;
        const tb = b.published_at ? Date.parse(b.published_at) : 0;
        return tb - ta;
      });
  });
}

export async function localGetCompanyById(id: string): Promise<LocalCompany | null> {
  return enqueue(async () => {
    const store = await loadStore();
    return store.companies.find((c) => c.id === id) ?? null;
  });
}
