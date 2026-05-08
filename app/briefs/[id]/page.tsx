import { aiBriefResponseSchema, deriveBriefTitle } from "@/lib/brief-schema";
import { dbGetBriefFinalContent, dbGetPublicBrief } from "@/lib/app-db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type BriefRow = {
  id: string;
  published_at: string | null;
  raw_input: unknown;
  final_content: unknown;
  companies: { name: string } | { name: string }[] | null;
};

type RawInputShape = {
  industry?: string;
  timeline?: string;
  budget?: string;
};

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const finalContent = await dbGetBriefFinalContent(id);

  const parsed = finalContent ? aiBriefResponseSchema.safeParse(finalContent) : null;
  const title = parsed?.success ? deriveBriefTitle(parsed.data.cel_rd) : "Brief R&D";
  return {
    title: `${title} | Nexdoc`,
    description: "Published R&D brief — apply as a researcher.",
  };
}

export default async function PublicBriefPage({ params }: PageProps) {
  const { id } = await params;
  const data = await dbGetPublicBrief(id);

  if (!data) {
    notFound();
  }

  const row = data as BriefRow;
  const rawInput = (row.raw_input ?? {}) as RawInputShape;
  const industry = rawInput.industry ?? "—";
  const timeline = rawInput.timeline ?? "—";
  const budget = rawInput.budget ?? "—";

  const contentParsed = aiBriefResponseSchema.safeParse(row.final_content);
  if (!contentParsed.success) {
    notFound();
  }
  const brief = contentParsed.data;
  const title = deriveBriefTitle(brief.cel_rd);
  const companyEmbed = row.companies;
  const companyRecord = Array.isArray(companyEmbed) ? companyEmbed[0] : companyEmbed;
  const companyName = companyRecord?.name ?? "Company";

  const published =
    row.published_at != null
      ? new Date(row.published_at).toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "—";

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)] py-10 px-4">
      <article className="max-w-3xl mx-auto rounded-xl border border-gray-200 bg-white p-6 sm:p-10 shadow-sm">
        <header className="mb-8">
          <p className="text-sm text-gray-500 mb-2">{companyName}</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 leading-tight">{title}</h1>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-700">
              {industry}
            </span>
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-700">
              {timeline}
            </span>
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-700">
              {budget}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-6">Published {published}</p>
        </header>

        <div className="space-y-8 text-gray-800 text-sm sm:text-base leading-relaxed">
          <section>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">R&D goal</h2>
            <p className="whitespace-pre-wrap">{brief.cel_rd}</p>
          </section>
          <section>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">
              Required competencies
            </h2>
            <ul className="list-disc list-inside space-y-1">
              {brief.wymagane_kompetencje.filter(Boolean).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">Project scope</h2>
            <p className="whitespace-pre-wrap">{brief.zakres_projektu}</p>
          </section>
          <section>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">
              Expected outcome
            </h2>
            <p className="whitespace-pre-wrap">{brief.oczekiwany_rezultat}</p>
          </section>
          <section>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">
              Pierwszy milestone
            </h2>
            <p className="whitespace-pre-wrap">{brief.pierwszy_milestone}</p>
          </section>
          <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">
              Researcher profile
            </h2>
            <p className="whitespace-pre-wrap text-gray-700">{brief.suggested_researcher_profile}</p>
          </section>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-200">
          <Link
            href={`/researcher/apply/${row.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Apply
          </Link>
        </div>
      </article>
    </div>
  );
}
