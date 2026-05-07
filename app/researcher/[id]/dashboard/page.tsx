import Link from "next/link";
import { notFound } from "next/navigation";
import {
  dbGetResearcherProfile,
  dbListFavoriteBriefsForUser,
  dbListApplicationsForResearcher,
  dbListPublishedBriefs,
  dbListResearcherProjectsProfile,
} from "@/lib/app-db";
import { deriveBriefTitle } from "@/lib/brief-utils";
import { classifyResearcher } from "@/lib/researcher-classification";
import { recommendBriefsForResearcher } from "@/lib/researcher-recommendations";
import { aiBriefResponseSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth-session";
import FavoriteBriefsSection, { type FavoriteBriefItem } from "./favorite-briefs-section";

type PageProps = { params: Promise<{ id: string }> };

const statusLabel: Record<string, string> = {
  pending: "Pending",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
};

export default async function ResearcherDashboardPage({ params }: PageProps) {
  const user = await requireUser("researcher");
  const { id } = await params;
  if (user.researcher_id !== id) notFound();
  const researcher = await dbGetResearcherProfile(id);
  if (!researcher) notFound();

  const [projects, briefs, applications] = await Promise.all([
    dbListResearcherProjectsProfile(researcher.id),
    dbListPublishedBriefs(),
    dbListApplicationsForResearcher(researcher.id),
  ]);
  const favoriteBriefRows = await dbListFavoriteBriefsForUser(user.id);

  const classification = classifyResearcher({
    stage: researcher.stage,
    research_description: researcher.research_description,
    practical_skills: researcher.practical_skills,
    publication_links: researcher.publication_links,
    projects,
  });
  const recommendations = recommendBriefsForResearcher(researcher, briefs, 5);
  const favoriteBriefs: FavoriteBriefItem[] = favoriteBriefRows
    .map((row) => {
      const parsed = aiBriefResponseSchema.safeParse(row.final_content);
      if (!parsed.success) return null;
      const raw = (row.raw_input ?? {}) as { industry?: string; timeline?: string };
      return {
        id: row.id as string,
        title: deriveBriefTitle(parsed.data.cel_rd),
        cel_rd: parsed.data.cel_rd,
        industry: raw.industry ?? null,
        timeline: raw.timeline ?? null,
      } satisfies FavoriteBriefItem;
    })
    .filter((row): row is FavoriteBriefItem => Boolean(row));

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)] px-4 py-10">
      <main className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-indigo-700">Researcher dashboard</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {researcher.first_name} {researcher.last_name}
              </h1>
              <p className="mt-1 text-sm text-gray-600">{researcher.institution}</p>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-700">
                {classification.summary}
              </p>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                {classification.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {classification.score}/100
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {classification.signals.map((signal) => (
              <span
                key={signal}
                className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700"
              >
                {signal}
              </span>
            ))}
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Profile completeness
            </p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {researcher.profile_completeness ?? 0}%
            </p>
            <p className="mt-2 text-sm text-gray-600">
              A more complete profile yields better recommendations and match explanations.
            </p>
          </article>
          <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Recommended briefs
            </p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {recommendations.length}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Ranked by domain, skills, collaboration mode and availability.
            </p>
          </article>
          <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Applications
            </p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {applications.length}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              After applying you will see the score and status from the company.
            </p>
          </article>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Best matches</h2>
              <p className="text-sm text-gray-600">
                Top briefs for your profile, with a short explanation.
              </p>
            </div>
            <Link href="/briefs" className="text-sm font-medium text-indigo-600 hover:underline">
              View all briefs
            </Link>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec) => (
              <article
                key={rec.briefId}
                className="rounded-xl border border-gray-200 bg-gray-50 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs text-gray-700">
                        {rec.industry}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs text-gray-700">
                        {rec.timeline}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-gray-900">
                      {deriveBriefTitle(rec.cel_rd)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-700">{rec.cel_rd}</p>
                  </div>
                  <div className="shrink-0 rounded-xl bg-white px-4 py-3 text-center">
                    <p className="text-xs text-gray-500">Match</p>
                    <p className="text-2xl font-semibold text-indigo-700">{rec.score}/100</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  <div>
                    <p className="font-medium text-emerald-800">Why it fits</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-700">
                      {rec.reasons.slice(0, 3).map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-amber-800">Watch out for</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-700">
                      {rec.gaps.slice(0, 2).map((gap) => (
                        <li key={gap}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/researcher/apply/${rec.briefId}`}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Apply
                  </Link>
                  <Link
                    href={`/briefs/${rec.briefId}`}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                  >
                    Full brief
                  </Link>
                </div>
              </article>
            ))}
            {recommendations.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600">
                No recommendations. Complete your profile or wait for new briefs.
              </p>
            ) : null}
          </div>
        </section>

        <FavoriteBriefsSection items={favoriteBriefs} />

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">My applications</h2>
          <div className="mt-4 space-y-3">
            {applications.map((app) => {
              const brief = Array.isArray(app.briefs) ? app.briefs[0] : app.briefs;
              const parsedBrief = aiBriefResponseSchema.safeParse(brief?.final_content);
              const title = parsedBrief.success
                ? deriveBriefTitle(parsedBrief.data.cel_rd)
                : "Brief R&D";
              return (
                <article key={app.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{title}</p>
                      <p className="mt-1 text-sm text-gray-600">{app.match_explanation}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                        {statusLabel[app.status] ?? app.status}
                      </span>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        {app.match_score ?? "—"}/100
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
            {applications.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600">
                You don&apos;t have any applications yet. Start with one of the recommended projects.
              </p>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
