import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  availabilityModeLabel,
  projectTypeLabel,
  stageLabel,
} from "@/lib/researcher-options";
import { dbGetResearcherProfile, dbListResearcherProjectsProfile } from "@/lib/app-db";
import type {
  AvailabilityMode,
  ResearcherProjectType,
  ResearcherStage,
} from "@/lib/validations";

type ResearcherRow = {
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

type ProjectRow = {
  id: string;
  title: string;
  description: string | null;
  type: ResearcherProjectType | null;
  year_from: number | null;
  year_to: number | null;
};

type PageProps = { params: { id: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await dbGetResearcherProfile(params.id);
  if (!data) return { title: "Profil badacza | RD Bridge" };
  return {
    title: `${data.first_name} ${data.last_name} — ${data.institution} | RD Bridge`,
    description: "Profil badacza w platformie R&D Bridge.",
  };
}

export default async function ResearcherProfilePage({ params }: PageProps) {
  const researcher = await dbGetResearcherProfile(params.id);

  if (!researcher) {
    notFound();
  }

  const r = researcher as ResearcherRow;

  const projectsRaw = await dbListResearcherProjectsProfile(r.id);
  const projects = projectsRaw as ProjectRow[];

  const completeness = r.profile_completeness ?? 0;
  const completenessTone =
    completeness >= 80
      ? "bg-green-500"
      : completeness >= 50
        ? "bg-amber-500"
        : "bg-red-500";

  const fullName = `${r.first_name} ${r.last_name}`;
  const skills = r.practical_skills ?? [];
  const modes = r.availability_modes ?? [];
  const publications = (r.publication_links ?? []).filter(
    (u) => typeof u === "string" && u.length > 0
  );

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)] py-10 px-4">
      <article className="max-w-3xl mx-auto rounded-xl border border-gray-200 bg-white p-6 sm:p-10 shadow-sm">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            {fullName}
          </h1>
          <p className="text-sm text-gray-600 mt-1">{r.institution}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              {stageLabel[r.stage] ?? r.stage}
              {r.phd_start_year ? ` · od ${r.phd_start_year}` : ""}
            </span>
            {r.research_domain ? (
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-700">
                {r.research_domain}
              </span>
            ) : null}
            {r.research_subdomain ? (
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-700">
                {r.research_subdomain}
              </span>
            ) : null}
          </div>
        </header>

        <section className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Kompletność profilu
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {completeness}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${completenessTone}`}
              style={{ width: `${Math.max(0, Math.min(100, completeness))}%` }}
            />
          </div>
        </section>

        <div className="space-y-8 text-gray-800 text-sm sm:text-base leading-relaxed">
          {r.research_description ? (
            <section>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">
                Czym się zajmuje
              </h2>
              <p className="whitespace-pre-wrap">{r.research_description}</p>
            </section>
          ) : null}

          {skills.length > 0 ? (
            <section>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">
                Umiejętności praktyczne
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <span
                    key={`${skill}-${idx}`}
                    className="inline-flex items-center bg-indigo-50 text-indigo-700 rounded-full px-3 py-1 text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {projects.length > 0 ? (
            <section>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">
                Projekty i doświadczenie
              </h2>
              <ul className="space-y-3">
                {projects.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <p className="font-semibold text-gray-900">{p.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[
                        p.type ? projectTypeLabel[p.type] : null,
                        formatYearRange(p.year_from, p.year_to),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {p.description ? (
                      <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                        {p.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">
              Dostępność
            </h2>
            <p className="text-gray-700">
              {r.availability_hours_per_week
                ? `${r.availability_hours_per_week} godz./tydzień`
                : "Dostępność nieuzupełniona"}
            </p>
            {modes.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {modes.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-700"
                  >
                    {availabilityModeLabel[m] ?? m}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          {r.motivation ? (
            <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">
                Motywacja
              </h2>
              <p className="whitespace-pre-wrap text-gray-700">{r.motivation}</p>
            </section>
          ) : null}

          {publications.length > 0 ? (
            <section>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">
                Publikacje
              </h2>
              <ul className="space-y-1 list-disc list-inside text-sm">
                {publications.map((url, idx) => (
                  <li key={`${url}-${idx}`}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 break-all"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="mt-10 pt-8 border-t border-gray-200 flex flex-wrap gap-3">
          <Link
            href="/briefs"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Przeglądaj briefy R&D
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Wróć na stronę główną
          </Link>
        </div>
      </article>
    </div>
  );
}

function formatYearRange(from: number | null, to: number | null): string | null {
  if (from && to) return `${from}–${to}`;
  if (from) return `od ${from}`;
  if (to) return `do ${to}`;
  return null;
}
