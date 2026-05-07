import Link from "next/link";
import type { Metadata } from "next";
import { localGetAllResearchers } from "@/lib/local-json-db";
import { classifyResearcher } from "@/lib/researcher-classification";
import ResearchersClient from "./researchers-client";

export const metadata: Metadata = {
  title: "Researcher Directory | Nexdoc",
  description: "Browse PhD researchers available for R&D collaboration.",
};

export default async function ResearchersPage() {
  let raw: Awaited<ReturnType<typeof localGetAllResearchers>> = [];
  try {
    raw = await localGetAllResearchers();
  } catch {
    raw = [];
  }

  const researchers = raw.map((r) => {
    const c = classifyResearcher({
      stage: r.stage,
      research_description: r.research_description,
      practical_skills: r.practical_skills,
      publication_links: r.publication_links,
      projects: [],
    });
    return { ...r, score: c.score };
  });

  const byDomain = researchers.reduce<Record<string, number>>((acc, r) => {
    const d = r.research_domain ?? "Other";
    acc[d] = (acc[d] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">Researcher Directory</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Find your next R&D collaborator</h1>
          <p className="mt-3 text-slate-400 max-w-xl">
            Browse PhD researchers available for industry projects. Filter by domain, stage and availability — then view the full profile.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/company/new-brief" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
              Post an R&D brief
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <Link href="/briefs" className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
              Browse R&D briefs
            </Link>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{researchers.length} researchers</span>
          {Object.entries(byDomain).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([d, n]) => (
            <span key={d} className="text-gray-400">
              {d.split(" ")[0]}: <span className="font-medium text-gray-700">{n}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Filterable grid */}
      <ResearchersClient researchers={researchers} />
    </div>
  );
}
