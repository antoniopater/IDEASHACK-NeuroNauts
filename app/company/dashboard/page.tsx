import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-session";
import {
  localGetBriefsByCompanyId,
  localGetCompanyById,
  localListApplicationsForBrief,
  localGetAllResearchers,
} from "@/lib/local-json-db";
import { aiBriefResponseSchema } from "@/lib/validations";
import { deriveBriefTitle } from "@/lib/brief-utils";
import { ScoreRing } from "@/components/shared/score-ring";

export const metadata: Metadata = { title: "Company Dashboard | Nexdoc" };

function truncate(s: string, n: number) {
  const t = s.trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

export default async function CompanyDashboardPage() {
  const user = await requireUser("company");
  if (!user.company_id) notFound();

  const [company, briefs, allResearchers] = await Promise.all([
    localGetCompanyById(user.company_id),
    localGetBriefsByCompanyId(user.company_id),
    localGetAllResearchers(),
  ]);

  if (!company) notFound();

  const briefsWithApps = await Promise.all(
    briefs.map(async (b) => {
      const apps = await localListApplicationsForBrief(b.id);
      const parsed = aiBriefResponseSchema.safeParse(b.final_content);
      const title = parsed.success ? deriveBriefTitle(parsed.data.cel_rd) : "R&D Brief";
      const raw = b.raw_input as { industry?: string; timeline?: string };
      return { brief: b, apps, title, industry: raw.industry ?? "", timeline: raw.timeline ?? "" };
    })
  );

  const totalApps = briefsWithApps.reduce((s, b) => s + b.apps.length, 0);
  const topScore = briefsWithApps
    .flatMap((b) => b.apps)
    .reduce((max, a) => Math.max(max, a.match_score ?? 0), 0);

  // Match landscape: top researchers across all briefs by score
  const allScores = briefsWithApps
    .flatMap((b) => b.apps.map((a) => ({ ...a, briefTitle: b.title })))
    .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)] px-4 py-10">
      <main className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Company dashboard</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">{company.name}</h1>
              <p className="mt-1 text-sm text-gray-500">{user.email}</p>
            </div>
            <Link
              href="/company/new-brief"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors self-start sm:self-auto"
            >
              + New R&D brief
            </Link>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Briefs published", value: briefs.length },
            { label: "Total applications", value: totalApps },
            { label: "Top match score", value: topScore ? `${topScore}/100` : "—" },
            { label: "Researchers pool", value: allResearchers.length },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
              <p className="mt-1.5 text-3xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </section>

        {/* Match landscape */}
        {allScores.length > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Match landscape</h2>
                <p className="text-sm text-gray-500 mt-0.5">Top applicants ranked by AI match score</p>
              </div>
            </div>
            <div className="space-y-3">
              {allScores.map((a, i) => {
                const r = Array.isArray(a.researchers) ? a.researchers[0] : a.researchers;
                if (!r) return null;
                const pct = a.match_score ?? 0;
                const color = pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-indigo-500" : "bg-amber-400";
                return (
                  <div key={a.id} className="flex items-center gap-4">
                    <span className="w-5 text-xs text-gray-400 font-mono shrink-0">{i + 1}</span>
                    <Link href={`/researcher/${r.id}`} className="shrink-0 hover:underline text-sm font-semibold text-gray-900 w-36 truncate">
                      {r.first_name} {r.last_name}
                    </Link>
                    <div className="flex-1 h-6 rounded-full bg-gray-100 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full ${color} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                      <span className="absolute inset-0 flex items-center pl-3 text-[11px] font-semibold text-white mix-blend-difference">
                        {pct}/100
                      </span>
                    </div>
                    <span className="shrink-0 text-[10px] text-gray-400 w-24 truncate text-right">{a.briefTitle}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Briefs list */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your briefs</h2>
          {briefsWithApps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <p className="text-gray-500 text-sm">No briefs published yet.</p>
              <Link href="/company/new-brief" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline">
                Create your first brief →
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {briefsWithApps.map(({ brief, apps, title, industry, timeline }) => {
                const topApps = apps.slice(0, 4);
                return (
                  <div key={brief.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {industry && (
                            <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                              {industry}
                            </span>
                          )}
                          {timeline && (
                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{timeline}</span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-gray-900 truncate">{title}</h3>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link
                          href={`/company/briefs/${brief.id}/applications`}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {apps.length} application{apps.length !== 1 ? "s" : ""}
                        </Link>
                        <Link
                          href={`/briefs/${brief.id}`}
                          className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          View brief
                        </Link>
                      </div>
                    </div>

                    {topApps.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Top applicants</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {topApps.map((app) => {
                            const r = Array.isArray(app.researchers) ? app.researchers[0] : app.researchers;
                            if (!r) return null;
                            return (
                              <Link
                                key={app.id}
                                href={`/researcher/${r.id}`}
                                className="group flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50 p-3 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-center"
                              >
                                <ScoreRing score={app.match_score ?? 0} size={52} strokeWidth={5} />
                                <p className="mt-2 text-xs font-semibold text-gray-800 group-hover:text-indigo-700 leading-tight">
                                  {r.first_name} {r.last_name}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{r.institution}</p>
                                <span className={`mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  app.status === "shortlisted" ? "bg-emerald-100 text-emerald-700" :
                                  app.status === "rejected" ? "bg-red-100 text-red-600" :
                                  "bg-gray-100 text-gray-600"
                                }`}>
                                  {app.status === "shortlisted" ? "Shortlisted" :
                                   app.status === "rejected" ? "Rejected" : "Pending"}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No applications yet — share the brief link to attract researchers.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Researchers pool teaser */}
        <section className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Explore the researcher pool</h2>
              <p className="mt-1 text-sm text-gray-600">
                {allResearchers.length} researchers registered — browse profiles, filter by domain and availability.
              </p>
            </div>
            <Link
              href="/researchers"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Browse researchers →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
