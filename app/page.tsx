import { aiBriefResponseSchema, deriveBriefTitle } from "@/lib/brief-schema";
import { dbListPublishedBriefsHomeLimit } from "@/lib/app-db";
import { industryBadgeClass } from "@/lib/industry-styles";
import { hasSupabasePublicConfig } from "@/lib/server-env";
import Link from "next/link";

type Raw = { industry?: string; timeline?: string; budget?: string };

function truncate(s: string, n: number) {
  const t = s.trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1)}…`;
}

export default async function Home() {
  let briefRows: { id: unknown; raw_input: unknown; final_content: unknown }[] | null = null;
  if (hasSupabasePublicConfig()) {
    briefRows = await dbListPublishedBriefsHomeLimit(3);
  }

  const previews: {
    id: string;
    industry: string;
    title: string;
    snippet: string;
  }[] = [];

  for (const row of briefRows ?? []) {
    const raw = (row.raw_input ?? {}) as Raw;
    const fc = aiBriefResponseSchema.safeParse(row.final_content);
    if (!fc.success) continue;
    previews.push({
      id: row.id as string,
      industry: raw.industry ?? "Inne",
      title: deriveBriefTitle(fc.data.cel_rd),
      snippet: truncate(fc.data.cel_rd, 140),
    });
  }

  return (
    <div className="font-[family-name:var(--font-geist-sans)] min-h-[calc(100vh-3.5rem)] bg-gray-50">
      <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <h1 className="text-center text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
          RD Bridge
        </h1>
        <p className="text-center text-gray-600 text-sm sm:text-base max-w-2xl mx-auto mb-12">
          Platforma łącząca firmy potrzebujące wsparcia R&D z doktorantami i młodymi badaczami.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          <Link
            href="/company/new-brief"
            className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:border-indigo-200 hover:shadow transition-all"
          >
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-800">
              Firma
            </h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Opisz problem R&D, AI stworzy brief, dopasujemy badacza.
            </p>
            <span className="mt-6 inline-block text-sm font-medium text-indigo-600">
              Utwórz brief →
            </span>
          </Link>
          <Link
            href="/researcher/register"
            className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:border-indigo-200 hover:shadow transition-all"
          >
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-800">
              Badacz
            </h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Zarejestruj profil, aplikuj na projekty dopasowane do twoich kompetencji.
            </p>
            <span className="mt-6 inline-block text-sm font-medium text-indigo-600">
              Załóż profil →
            </span>
          </Link>
        </div>

        <div className="border-t border-gray-200 pt-10">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-base font-semibold text-gray-900">Najnowsze briefy</h2>
            <Link href="/briefs" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
              Zobacz wszystkie
            </Link>
          </div>
          {previews.length === 0 ? (
            <p className="text-sm text-gray-500">Brak opublikowanych briefów.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {previews.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/briefs/${b.id}`}
                    className="block h-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 transition-colors"
                  >
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${industryBadgeClass(b.industry)}`}
                    >
                      {b.industry}
                    </span>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 line-clamp-2">{b.title}</h3>
                    <p className="mt-1 text-xs text-gray-600 line-clamp-3">{b.snippet}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
