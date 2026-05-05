import { aiBriefResponseSchema, deriveBriefTitle } from "@/lib/brief-schema";
import { dbGetPublicBrief } from "@/lib/app-db";
import { industryBadgeClass } from "@/lib/industry-styles";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ApplyFormClient from "./apply-form-client";

type Raw = { industry?: string; timeline?: string; budget?: string };

export async function generateMetadata({
  params,
}: {
  params: { briefId: string };
}): Promise<Metadata> {
  const data = await dbGetPublicBrief(params.briefId);
  const parsed = data?.final_content ? aiBriefResponseSchema.safeParse(data.final_content) : null;
  const title = parsed?.success ? deriveBriefTitle(parsed.data.cel_rd) : "Aplikacja";
  return { title: `Aplikuj: ${title} | RD Bridge` };
}

export default async function ApplyPage({ params }: { params: { briefId: string } }) {
  const data = await dbGetPublicBrief(params.briefId);

  if (!data) notFound();

  const fc = aiBriefResponseSchema.safeParse(data.final_content);
  if (!fc.success) notFound();

  const brief = fc.data;
  const raw = (data.raw_input ?? {}) as Raw;
  const industry = raw.industry ?? "—";
  const timeline = raw.timeline ?? "—";
  const budget = raw.budget ?? "—";
  const title = deriveBriefTitle(brief.cel_rd);
  const co = data.companies as { name: string } | { name: string }[] | null | undefined;
  const companyName = (Array.isArray(co) ? co[0] : co)?.name ?? "Firma";

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Link
          href={`/briefs/${params.briefId}`}
          className="text-sm text-indigo-600 hover:text-indigo-800 mb-6 inline-block"
        >
          ← Pełny brief
        </Link>

        <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
          <div className="flex-1 min-w-0 space-y-6">
            <header className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">{companyName}</p>
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              <div className="flex flex-wrap gap-2 mt-3">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${industryBadgeClass(industry)}`}
                >
                  {industry}
                </span>
                <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-700">
                  {timeline}
                </span>
                <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-700">
                  {budget}
                </span>
              </div>
            </header>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-6 text-sm text-gray-800">
              <section>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">Cel R&D</h2>
                <p className="whitespace-pre-wrap leading-relaxed">{brief.cel_rd}</p>
              </section>
              <section>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">
                  Wymagane kompetencje
                </h2>
                <ul className="list-disc list-inside space-y-1">
                  {brief.wymagane_kompetencje.filter(Boolean).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">
                  Zakres projektu
                </h2>
                <p className="whitespace-pre-wrap leading-relaxed">{brief.zakres_projektu}</p>
              </section>
              <section>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">
                  Oczekiwany rezultat
                </h2>
                <p className="whitespace-pre-wrap leading-relaxed">{brief.oczekiwany_rezultat}</p>
              </section>
              <section>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">
                  Pierwszy milestone
                </h2>
                <p className="whitespace-pre-wrap leading-relaxed">{brief.pierwszy_milestone}</p>
              </section>
              <section className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">
                  Profil badacza (sugestia)
                </h2>
                <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {brief.suggested_researcher_profile}
                </p>
              </section>
            </div>
          </div>

          <aside className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-6">
            <ApplyFormClient briefId={params.briefId} />
          </aside>
        </div>
      </div>
    </div>
  );
}
