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

const DOMAINS = Object.keys(DOMAIN_STYLE).filter((d) => d !== "Other");
const STAGE_OPTS = [
  { value: "doktorant", label: "PhD Student" },
  { value: "doktor",    label: "PhD" },
  { value: "postdoc",   label: "Postdoc" },
];

function ds(domain: string | null) {
  return DOMAIN_STYLE[domain ?? ""] ?? DOMAIN_STYLE["Other"];
}
function initials(f: string, l: string) {
  return `${f[0] ?? ""}${l[0] ?? ""}`.toUpperCase();
}
function trunc(s: string, n: number) {
  const t = s.trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

export default function ResearchersClient({ researchers }: { researchers: ResearcherCard[] }) {
  const [search, setSearch] = useState("");
  const [activeDomains, setActiveDomains] = useState<string[]>([]);
  const [activeStages, setActiveStages] = useState<string[]>([]);
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState<"score" | "completeness" | "name">("score");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return researchers
      .filter((r) => {
        if (q) {
          const hay = [r.first_name, r.last_name, r.institution,
            r.research_domain ?? "", r.research_description ?? "",
            ...(r.practical_skills ?? [])].join(" ").toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (activeDomains.length > 0 && !activeDomains.includes(r.research_domain ?? "")) return false;
        if (activeStages.length > 0 && !activeStages.includes(r.stage)) return false;
        if (r.score < minScore) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "score") return b.score - a.score;
        if (sortBy === "completeness") return (b.profile_completeness ?? 0) - (a.profile_completeness ?? 0);
        return a.first_name.localeCompare(b.first_name);
      });
  }, [researchers, search, activeDomains, activeStages, minScore, sortBy]);

  function toggleDomain(d: string) {
    setActiveDomains((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d]);
  }
  function toggleStage(s: string) {
    setActiveStages((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  }
  const hasFilters = search || activeDomains.length > 0 || activeStages.length > 0 || minScore > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">

      {/* ── Filter toolbar ── */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
        {/* Row 1: search + sort + toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search name, skill, topic…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 cursor-pointer"
          >
            <option value="score">Sort: match score</option>
            <option value="completeness">Sort: profile %</option>
            <option value="name">Sort: name A-Z</option>
          </select>

          <button
            type="button"
            onClick={() => setShowFilters((p) => !p)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${showFilters ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
            Filters
            {hasFilters && <span className="h-2 w-2 rounded-full bg-indigo-500" />}
          </button>

          <span className="ml-auto text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{filtered.length}</span> / {researchers.length}
          </span>
        </div>

        {/* Row 2: domain pills (always visible) */}
        <div className="flex flex-wrap gap-2">
          {DOMAINS.map((d) => {
            const active = activeDomains.includes(d);
            const style = ds(d);
            const short = d.split(" ").slice(0, 2).join(" ");
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDomain(d)}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${active ? `${style.header} text-white border-transparent shadow-sm` : `${style.badge} border-transparent hover:opacity-80`}`}
              >
                {short}
              </button>
            );
          })}
        </div>

        {/* Row 3: extra filters (collapsible) */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stage:</span>
              {STAGE_OPTS.map((s) => (
                <label key={s.value} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                  <input type="checkbox" checked={activeStages.includes(s.value)} onChange={() => toggleStage(s.value)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400" />
                  {s.label}
                </label>
              ))}
            </div>
            <div className="flex items-center gap-3 min-w-[220px]">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">
                Min score: <span className="text-indigo-600">{minScore}</span>
              </span>
              <input type="range" min={0} max={80} step={5} value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="flex-1 accent-indigo-600" />
            </div>
            {hasFilters && (
              <button type="button"
                onClick={() => { setSearch(""); setActiveDomains([]); setActiveStages([]); setMinScore(0); }}
                className="text-xs text-indigo-600 hover:underline ml-auto">
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Card grid ── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center">
          <p className="text-gray-500 text-sm">No researchers match the filters.</p>
          <button onClick={() => { setSearch(""); setActiveDomains([]); setActiveStages([]); setMinScore(0); }}
            className="mt-3 text-sm text-indigo-600 hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((r) => {
            const s = ds(r.research_domain);
            const skills = (r.practical_skills ?? []).slice(0, 2);
            const stage = stageLabel[r.stage as keyof typeof stageLabel] ?? r.stage;
            const mode = (r.availability_modes ?? [])[0];

            return (
              <Link
                key={r.id}
                href={`/researcher/${r.id}`}
                className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                {/* Coloured header */}
                <div className={`${s.header} px-3 pt-3 pb-4 text-center`}>
                  {/* Domain badge */}
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold leading-tight ${s.badge}`}>
                    {trunc(r.research_domain ?? "Research", 22)}
                  </span>
                  {/* Avatar */}
                  <div className="mt-3 flex justify-center">
                    <div className={`h-14 w-14 rounded-full ${s.avatar} ring-4 ring-white/30 flex items-center justify-center shadow-md`}>
                      <span className="text-lg font-extrabold text-white">{initials(r.first_name, r.last_name)}</span>
                    </div>
                  </div>
                </div>

                {/* White body */}
                <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3">
                  {/* Score ring + name */}
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-gray-900 group-hover:text-indigo-700 transition-colors leading-snug">
                        {r.first_name}<br />{r.last_name}
                      </h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">{stage}{r.phd_start_year ? ` · ${r.phd_start_year}` : ""}</p>
                    </div>
                    <div className="shrink-0">
                      <ScoreRing score={r.score} size={44} strokeWidth={4} />
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400 leading-tight line-clamp-1">{r.institution}</p>

                  {r.research_description ? (
                    <p className="mt-2 text-[10px] text-gray-600 italic leading-relaxed line-clamp-3">
                      &ldquo;{trunc(r.research_description, 90)}&rdquo;
                    </p>
                  ) : null}

                  {skills.length > 0 ? (
                    <div className="mt-2 flex flex-col gap-1">
                      {skills.map((sk, i) => (
                        <span key={i} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-600 truncate">
                          {trunc(sk, 30)}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-auto pt-2.5 flex items-center justify-between gap-1">
                    {r.availability_hours_per_week ? (
                      <span className="text-[10px] text-gray-500">⏱ {r.availability_hours_per_week}h/w</span>
                    ) : <span />}
                    {mode ? (
                      <span className="rounded-full border border-gray-200 px-1.5 py-0.5 text-[9px] text-gray-500 text-right leading-tight">
                        {availabilityModeLabel[mode as keyof typeof availabilityModeLabel]?.split(" ")[0] ?? ""}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 h-1 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${r.profile_completeness ?? 0}%` }} />
                  </div>
                  <p className="mt-0.5 text-[9px] text-gray-400">{r.profile_completeness ?? 0}% complete</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
