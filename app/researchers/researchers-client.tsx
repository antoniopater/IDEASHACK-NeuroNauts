"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ScoreRing } from "@/components/shared/score-ring";
import { stageLabel, availabilityModeLabel } from "@/lib/researcher-options";

type ResearcherCard = {
  id: string;
  first_name: string;
  last_name: string;
  institution: string;
  stage: string;
  phd_start_year: number | null;
  research_domain: string | null;
  research_description: string | null;
  practical_skills: string[] | null;
  availability_hours_per_week: number | null;
  availability_modes: string[] | null;
  profile_completeness: number | null;
  score: number;
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

const ALL_DOMAINS = Object.keys(DOMAIN_STYLE).filter((d) => d !== "Other");
const ALL_STAGES = ["doktorant", "doktor", "ktor", "postdoc"] as const;

function ds(domain: string | null) {
  return DOMAIN_STYLE[domain ?? ""] ?? DOMAIN_STYLE["Other"];
}

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function truncate(s: string, n: number) {
  const t = s.trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

export default function ResearchersClient({ researchers }: { researchers: ResearcherCard[] }) {
  const [search, setSearch] = useState("");
  const [domains, setDomains] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [minScore, setMinScore] = useState(0);
  const [minHours, setMinHours] = useState(0);
  const [sortBy, setSortBy] = useState<"score" | "completeness" | "name">("score");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return researchers
      .filter((r) => {
        if (q) {
          const hay = [
            r.first_name, r.last_name, r.institution,
            r.research_domain ?? "", r.research_description ?? "",
            ...(r.practical_skills ?? []),
          ].join(" ").toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (domains.length > 0 && !domains.includes(r.research_domain ?? "")) return false;
        if (stages.length > 0 && !stages.includes(r.stage)) return false;
        if (r.score < minScore) return false;
        if (minHours > 0 && (r.availability_hours_per_week ?? 0) < minHours) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "score") return b.score - a.score;
        if (sortBy === "completeness") return (b.profile_completeness ?? 0) - (a.profile_completeness ?? 0);
        return a.first_name.localeCompare(b.first_name);
      });
  }, [researchers, search, domains, stages, minScore, minHours, sortBy]);

  function toggleDomain(d: string) {
    setDomains((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }
  function toggleStage(s: string) {
    setStages((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }
  function clearAll() {
    setSearch(""); setDomains([]); setStages([]); setMinScore(0); setMinHours(0);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 mx-auto max-w-6xl px-4 py-8">

      {/* ── Sidebar filters ── */}
      <aside className="lg:w-64 shrink-0">
        <div className="lg:sticky lg:top-20 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-5">
          {/* Search */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1.5">Search</label>
            <div className="relative">
              <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Name, skills, topic…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1.5">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
            >
              <option value="score">Match score</option>
              <option value="completeness">Profile completeness</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          {/* Domain filter */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Domain</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_DOMAINS.map((d) => {
                const active = domains.includes(d);
                const style = ds(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDomain(d)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-colors ${
                      active ? `${style.header} text-white border-transparent` : `${style.badge} border-transparent hover:opacity-80`
                    }`}
                  >
                    {d.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stage filter */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Career stage</p>
            <div className="space-y-1.5">
              {ALL_STAGES.map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={stages.includes(s)}
                    onChange={() => toggleStage(s)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
                  />
                  {stageLabel[s as keyof typeof stageLabel] ?? s}
                </label>
              ))}
            </div>
          </div>

          {/* Min score */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1.5">
              Min score: <span className="text-indigo-600">{minScore}</span>
            </label>
            <input
              type="range" min={0} max={80} step={5}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Min availability */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1.5">
              Min h/week: <span className="text-indigo-600">{minHours === 0 ? "any" : minHours}</span>
            </label>
            <input
              type="range" min={0} max={40} step={4}
              value={minHours}
              onChange={(e) => setMinHours(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          <button
            type="button"
            onClick={clearAll}
            className="w-full rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      </aside>

      {/* ── Card grid ── */}
      <main className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{filtered.length}</span> of {researchers.length} researchers
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center">
            <p className="text-gray-500 text-sm">No researchers match the selected filters.</p>
            <button onClick={clearAll} className="mt-3 text-sm text-indigo-600 hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((r) => {
              const s = ds(r.research_domain);
              const skills = (r.practical_skills ?? []).slice(0, 3);
              const stage = stageLabel[r.stage as keyof typeof stageLabel] ?? r.stage;
              const mode = (r.availability_modes ?? [])[0];

              return (
                <Link
                  key={r.id}
                  href={`/researcher/${r.id}`}
                  className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden"
                >
                  {/* Coloured header */}
                  <div className={`${s.header} px-4 pt-4 pb-5`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${s.badge}`}>
                        {r.research_domain ?? "Research"}
                      </span>
                      <div className="shrink-0">
                        <ScoreRing score={r.score} size={44} strokeWidth={4} />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-center">
                      <div className={`h-14 w-14 rounded-full ${s.avatar} ring-4 ring-white/30 flex items-center justify-center shadow-lg`}>
                        <span className="text-lg font-extrabold text-white">{initials(r.first_name, r.last_name)}</span>
                      </div>
                    </div>
                  </div>

                  {/* White body */}
                  <div className="flex flex-col flex-1 px-4 pt-3 pb-4">
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                      {r.first_name} {r.last_name}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {stage}{r.phd_start_year ? ` · since ${r.phd_start_year}` : ""}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{r.institution}</p>

                    {r.research_description ? (
                      <p className="mt-2.5 text-[11px] text-gray-600 italic leading-relaxed line-clamp-3">
                        &ldquo;{truncate(r.research_description, 110)}&rdquo;
                      </p>
                    ) : null}

                    {skills.length > 0 ? (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {skills.map((sk, i) => (
                          <span key={i} className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                            {truncate(sk, 26)}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-auto pt-3 flex items-center justify-between gap-1 text-[11px] text-gray-500">
                      {r.availability_hours_per_week ? <span>⏱ {r.availability_hours_per_week}h/week</span> : <span />}
                      {mode ? (
                        <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[10px] text-gray-500">
                          {availabilityModeLabel[mode as keyof typeof availabilityModeLabel] ?? mode}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 h-1 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${r.profile_completeness ?? 0}%` }} />
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">Profile {r.profile_completeness ?? 0}% complete</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
