import Link from "next/link";
import type { Metadata } from "next";
import { localGetAllResearchers } from "@/lib/local-json-db";
import { stageLabel, availabilityModeLabel } from "@/lib/researcher-options";
import { classifyResearcher } from "@/lib/researcher-classification";

export const metadata: Metadata = {
  title: "Researcher Directory | Nexdoc",
  description: "Browse PhD researchers available for R&D collaboration.",
};

const DOMAIN_STYLE: Record<string, { header: string; badge: string; avatar: string; bar: string }> = {
  "Computer Science & AI":         { header: "bg-indigo-600",  badge: "bg-indigo-100 text-indigo-800",  avatar: "bg-indigo-500",  bar: "bg-indigo-500" },
  "Engineering & Technology":      { header: "bg-blue-600",    badge: "bg-blue-100 text-blue-800",      avatar: "bg-blue-500",    bar: "bg-blue-500" },
  "Chemistry & Materials Science": { header: "bg-violet-600",  badge: "bg-violet-100 text-violet-800",  avatar: "bg-violet-500",  bar: "bg-violet-500" },
  "Medical Sciences & Health":     { header: "bg-teal-600",    badge: "bg-teal-100 text-teal-800",      avatar: "bg-teal-500",    bar: "bg-teal-500" },
  "Natural Sciences":              { header: "bg-emerald-600", badge: "bg-emerald-100 text-emerald-800",avatar: "bg-emerald-500", bar: "bg-emerald-500" },
  "Mathematics & Statistics":      { header: "bg-amber-500",   badge: "bg-amber-100 text-amber-800",    avatar: "bg-amber-500",   bar: "bg-amber-500" },
  "Economics & Business":          { header: "bg-orange-500",  badge: "bg-orange-100 text-orange-800",  avatar: "bg-orange-500",  bar: "bg-orange-500" },
  "Social Sciences":               { header: "bg-pink-500",    badge: "bg-pink-100 text-pink-800",      avatar: "bg-pink-500",    bar: "bg-pink-500" },
  "Other":                         { header: "bg-slate-600",   badge: "bg-slate-100 text-slate-700",    avatar: "bg-slate-500",   bar: "bg-slate-500" },
};

function domainStyle(domain: string | null) {
  return DOMAIN_STYLE[domain ?? ""] ?? DOMAIN_STYLE["Other"];
}

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function truncate(s: string, n: number) {
  const t = s.trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

export default async function ResearchersPage() {
  let researchers: Awaited<ReturnType<typeof localGetAllResearchers>> = [];
  try {
    researchers = await localGetAllResearchers();
  } catch {
    researchers = [];
  }

  const classified = researchers.map((r) => {
    const c = classifyResearcher({
      stage: r.stage,
      research_description: r.research_description,
      practical_skills: r.practical_skills,
      publication_links: r.publication_links,
      projects: [],
    });
    return { ...r, classification: c };
  });

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)]">

      {/* Page header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">Researcher Directory</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Find your next R&D collaborator</h1>
          <p className="mt-3 text-slate-400 max-w-xl">
            Browse PhD researchers available for industry projects. Each profile shows research domain, skills, availability and an AI-computed match potential.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/company/new-brief"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Post an R&D brief
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/briefs"
              className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Browse R&D briefs
            </Link>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-6xl flex items-center gap-6 text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{classified.length} researchers</span>
          <span className="text-gray-300">|</span>
          <span>{classified.filter(r => r.stage === "doktorant").length} PhD students</span>
          <span className="text-gray-300">|</span>
          <span>{classified.filter(r => r.stage === "doktor" || r.stage === "ktor").length} PhDs</span>
          <span className="text-gray-300">|</span>
          <span>{classified.filter(r => r.stage === "postdoc").length} postdocs</span>
        </div>
      </div>

      {/* Card grid */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        {classified.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center">
            <p className="text-gray-500 text-sm">No researchers in the directory yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Start the app with: <code className="bg-gray-100 px-1 rounded">USE_LOCAL_JSON_DB=1 npm run dev</code>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {classified.map((r) => {
              const s = domainStyle(r.research_domain);
              const skills = (r.practical_skills ?? []).slice(0, 3);
              const stage = stageLabel[r.stage as keyof typeof stageLabel] ?? r.stage;
              const mode = (r.availability_modes ?? [])[0];

              return (
                <Link
                  key={r.id}
                  href={`/researcher/${r.id}`}
                  className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden"
                >
                  {/* ── Coloured header ── */}
                  <div className={`${s.header} px-4 pt-4 pb-5`}>
                    {/* Top row: domain badge + score */}
                    <div className="flex items-start justify-between gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${s.badge}`}>
                        {r.research_domain ?? "Research"}
                      </span>
                      <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                        {r.classification.score}/100
                      </span>
                    </div>

                    {/* Avatar centred in header */}
                    <div className="mt-4 flex justify-center">
                      <div className={`h-16 w-16 rounded-full ${s.avatar} ring-4 ring-white/30 flex items-center justify-center shadow-lg`}>
                        <span className="text-xl font-extrabold text-white tracking-tight">
                          {initials(r.first_name, r.last_name)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── White body ── */}
                  <div className="flex flex-col flex-1 px-4 pt-3 pb-4">
                    {/* Name + stage */}
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition-colors leading-snug">
                      {r.first_name} {r.last_name}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {stage}{r.phd_start_year ? ` · since ${r.phd_start_year}` : ""}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{r.institution}</p>

                    {/* Research quote */}
                    {r.research_description ? (
                      <p className="mt-2.5 text-[11px] text-gray-600 italic leading-relaxed line-clamp-3">
                        &ldquo;{truncate(r.research_description, 110)}&rdquo;
                      </p>
                    ) : null}

                    {/* Skill tags */}
                    {skills.length > 0 ? (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {skills.map((sk, i) => (
                          <span key={i} className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                            {truncate(sk, 26)}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {/* Availability row */}
                    <div className="mt-auto pt-3 flex items-center justify-between gap-1 text-[11px] text-gray-500">
                      {r.availability_hours_per_week ? (
                        <span>⏱ {r.availability_hours_per_week}h/week</span>
                      ) : <span />}
                      {mode ? (
                        <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[10px] text-gray-500">
                          {availabilityModeLabel[mode as keyof typeof availabilityModeLabel] ?? mode}
                        </span>
                      ) : null}
                    </div>

                    {/* Completeness bar */}
                    <div className="mt-2 h-1 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.bar}`}
                        style={{ width: `${r.profile_completeness ?? 0}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">
                      Profile {r.profile_completeness ?? 0}% complete
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
