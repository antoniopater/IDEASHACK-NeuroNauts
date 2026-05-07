"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ScoreRing } from "./score-ring";

type PreviewResearcher = {
  id: string;
  first_name: string;
  last_name: string;
  institution: string;
  stage: string;
  research_domain: string | null;
  research_description: string | null;
  practical_skills: string[];
  availability_hours_per_week: number | null;
  score: number;
};

const STAGE: Record<string, string> = {
  doktorant: "PhD Student", doktor: "PhD", ktor: "PhD", postdoc: "Postdoc",
};

const DOMAIN_COLOR: Record<string, string> = {
  "Computer Science & AI": "bg-indigo-500",
  "Engineering & Technology": "bg-blue-500",
  "Natural Sciences": "bg-emerald-500",
  "Mathematics & Statistics": "bg-amber-500",
  "Medical Sciences & Health": "bg-teal-500",
  "Chemistry & Materials Science": "bg-violet-500",
};

function domainColor(d: string | null) {
  return DOMAIN_COLOR[d ?? ""] ?? "bg-slate-500";
}

function initials(f: string, l: string) {
  return `${f[0] ?? ""}${l[0] ?? ""}`.toUpperCase();
}

export function ResearcherPreviewPanel({
  problem,
  domain,
}: {
  problem: string;
  domain: string;
}) {
  const [researchers, setResearchers] = useState<PreviewResearcher[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (problem.trim().length < 50) {
      setResearchers([]);
      setTriggered(false);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      setTriggered(true);
      try {
        const res = await fetch("/api/researchers/quick-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problem: problem.trim(), domain }),
        });
        const data = (await res.json()) as { researchers?: PreviewResearcher[] };
        setResearchers(data.researchers ?? []);
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    }, 700);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [problem, domain]);

  if (!triggered && problem.trim().length < 50) return null;

  return (
    <div className="rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50/80 to-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
          Potential matches
        </p>
        {loading && (
          <svg className="ml-auto w-4 h-4 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
      </div>

      {researchers.length === 0 && !loading ? (
        <p className="text-xs text-gray-400 italic">Matching researchers to your description…</p>
      ) : (
        <div className="space-y-2">
          {researchers.map((r) => (
            <Link
              key={r.id}
              href={`/researcher/${r.id}`}
              target="_blank"
              className="group flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2.5 hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div className={`h-9 w-9 shrink-0 rounded-full ${domainColor(r.research_domain)} flex items-center justify-center`}>
                <span className="text-xs font-bold text-white">{initials(r.first_name, r.last_name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 group-hover:text-indigo-700 truncate">
                  {r.first_name} {r.last_name}
                </p>
                <p className="text-[10px] text-gray-400 truncate">{r.research_domain} · {STAGE[r.stage] ?? r.stage}</p>
                {r.practical_skills[0] && (
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{r.practical_skills[0]}</p>
                )}
              </div>
              <ScoreRing score={r.score} size={40} strokeWidth={4} animate />
            </Link>
          ))}
        </div>
      )}
      <Link
        href="/researchers"
        target="_blank"
        className="mt-3 block text-center text-xs text-indigo-600 hover:underline"
      >
        Browse all researchers →
      </Link>
    </div>
  );
}
