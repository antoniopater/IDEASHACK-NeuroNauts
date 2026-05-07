import Link from "next/link";
import type { Metadata } from "next";
import { dbListPublishedBriefs } from "@/lib/app-db";
import { localGetAllResearchers } from "@/lib/local-json-db";
import { stageLabel, availabilityModeLabel } from "@/lib/researcher-options";
import { classifyResearcher } from "@/lib/researcher-classification";

export const metadata: Metadata = {
  title: "Researcher Directory | Nexdoc",
  description: "Browse PhD researchers available for R&D collaboration.",
};

const DOMAIN_STYLE: Record<string, { bg: string; badge: string; avatar: string; dot: string }> = {
  "Computer Science & AI":      { bg: "bg-indigo-50",  badge: "bg-indigo-100 text-indigo-800",  avatar: "from-indigo-500 to-indigo-700",  dot: "bg-indigo-400" },
  "Engineering & Technology":   { bg: "bg-blue-50",    badge: "bg-blue-100 text-blue-800",      avatar: "from-blue-500 to-blue-700",      dot: "bg-blue-400" },
  "Chemistry & Materials Science": { bg: "bg-violet-50", badge: "bg-violet-100 text-violet-800", avatar: "from-violet-500 to-violet-700",  dot: "bg-violet-400" },
  "Medical Sciences & Health":  { bg: "bg-teal-50",    badge: "bg-teal-100 text-teal-800",      avatar: "from-teal-500 to-teal-700",      dot: "bg-teal-400" },
  "Natural Sciences":           { bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-800",avatar: "from-emerald-500 to-emerald-700",dot: "bg-emerald-400" },
  "Mathematics & Statistics":   { bg: "bg-amber-50",   badge: "bg-amber-100 text-amber-800",    avatar: "from-amber-500 to-amber-700",    dot: "bg-amber-400" },
  "Economics & Business":       { bg: "bg-orange-50",  badge: "bg-orange-100 text-orange-800",  avatar: "from-orange-500 to-orange-700",  dot: "bg-orange-400" },
  "Social Sciences":            { bg: "bg-pink-50",    badge: "bg-pink-100 text-pink-800",      avatar: "from-pink-500 to-pink-700",      dot: "bg-pink-400" },
  "Other":                      { bg: "bg-slate-50",   badge: "bg-slate-100 text-slate-700",    avatar: "from-slate-500 to-slate-700",    dot: "bg-slate-400" },
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
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">Researcher Directory</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Find your next R&D collaborator
          </h1>
          <p className="mt-3 text-slate-400 max-w-xl">
            Browse PhD researchers available for industry projects. Each profile shows research domain, skills, availability and an AI-computed match potential.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/company/new-brief"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Post an R&D brief
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
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
      <div className="border-b border-gray-200 bg-white px-4 py-4">
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
              Run the app in local JSON mode: <code className="bg-gray-100 px-1 rounded">USE_LOCAL_JSON_DB=1 npm run dev</code>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {classified.map((r) => {
              const style = domainStyle(r.research_domain);
              const skills = (r.practical_skills ?? []).slice(0, 3);
              const stage = stageLabel[r.stage as keyof typeof stageLabel] ?? r.stage;
              const modes = (r.availability_modes ?? []).slice(0, 1);

              return (
                <Link
                  key={r.id}
                  href={`/researcher/${r.id}`}
                  className="group flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden"
                >
                  {/* Colored top section */}
                  <div className={`relative ${style.bg} px-5 pt-5 pb-8`}>
                    {/* Domain badge */}
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${style.badge}`}>
                      {r.research_domain ?? "Research"}
                    </span>

                    {/* Avatar */}
                    <div className="mt-4 flex justify-center">
                      <div className={`h-20 w-20 rounded-full bg-gradient-to-br ${style.avatar} flex items-center justify-center shadow-lg`}>
                        <span className="text-2xl font-bold text-white">
                          {initials(r.first_name, r.last_name)}
                        </span>
                      </div>
                    </div>

                    {/* Score badge */}
                    <div className="absolute top-4 right-4 rounded-full bg-white/80 backdrop-blur px-2 py-0.5 text-[10px] font-bold text-gray-700 shadow-sm">
                      {r.classification.score}/100
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-col flex-1 px-5 pt-4 pb-5">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-700 transition-colors leading-tight">
                      {r.first_name} {r.last_name}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {stage}
                      {r.phd_start_year ? ` · since ${r.phd_start_year}` : ""}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400 truncate">{r.institution}</p>

                    {r.research_description ? (
                      <p className="mt-3 text-xs text-gray-600 italic leading-relaxed line-clamp-3">
                        &ldquo;{truncate(r.research_description, 120)}&rdquo;
                      </p>
                    ) : null}

                    {skills.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {skills.map((s, i) => (
                          <span key={i} className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                            {truncate(s, 28)}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-auto pt-4 flex items-center justify-between">
                      {r.availability_hours_per_week ? (
                        <span className="text-[11px] text-gray-500">
                          ⏱ {r.availability_hours_per_week}h/week
                        </span>
                      ) : null}
                      {modes.length > 0 ? (
                        <span className="text-[10px] rounded-full border border-gray-200 px-2 py-0.5 text-gray-500">
                          {availabilityModeLabel[modes[0] as keyof typeof availabilityModeLabel] ?? modes[0]}
                        </span>
                      ) : null}
                    </div>

                    <div className={`mt-3 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden`}>
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${style.avatar} opacity-70`}
                        style={{ width: `${r.profile_completeness ?? 0}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">Profile {r.profile_completeness ?? 0}% complete</p>
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
