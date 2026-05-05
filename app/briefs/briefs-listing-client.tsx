"use client";

import {
  type BudgetFilterId,
  budgetMatchesFilter,
  industriesMatch,
  type TimelineFilterId,
  timelineMatchesFilter,
} from "@/lib/brief-filters";
import { filterIndustryOptions, industryBadgeClass } from "@/lib/industry-styles";
import Link from "next/link";
import { useMemo, useState } from "react";

export type BriefListItem = {
  id: string;
  published_at: string | null;
  industry: string;
  timeline: string;
  budget: string;
  cel_rd: string;
  wymagane_kompetencje: string[];
};

function daysAgoLabel(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const d = Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
  if (d <= 0) return "dzisiaj";
  if (d === 1) return "1 dzień temu";
  if (d < 5) return `${d} dni temu`;
  if (d < 22) return `${d} dni temu`;
  const w = Math.floor(d / 7);
  if (w === 1) return "1 tydzień temu";
  return `${w} tygodni temu`;
}

function truncate(s: string, n: number): string {
  const t = s.trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1)}…`;
}

export default function BriefsListingClient({ items }: { items: BriefListItem[] }) {
  const [industrySel, setIndustrySel] = useState<string[]>([]);
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilterId>("all");
  const [budgetFilter, setBudgetFilter] = useState<BudgetFilterId>("all");

  const filtered = useMemo(() => {
    return items.filter((b) => {
      if (!industriesMatch(industrySel, b.industry)) return false;
      if (!timelineMatchesFilter(b.timeline, timelineFilter)) return false;
      if (!budgetMatchesFilter(b.budget, budgetFilter)) return false;
      return true;
    });
  }, [items, industrySel, timelineFilter, budgetFilter]);

  function toggleIndustry(i: string) {
    setIndustrySel((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  function clearFilters() {
    setIndustrySel([]);
    setTimelineFilter("all");
    setBudgetFilter("all");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 font-[family-name:var(--font-geist-sans)]">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Briefy R&D</h1>
        <p className="text-sm text-gray-600 mt-1">
          Przeglądaj opublikowane projekty i aplikuj jako badacz.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
        <main className="flex-1 min-w-0 lg:w-2/3 space-y-4 order-2 lg:order-1">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-600">
              {items.length === 0 ? "Brak briefów" : "Brak briefów spełniających kryteria"}
            </div>
          ) : (
            filtered.map((b) => (
              <article
                key={b.id}
                className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    /* industry badge — color by domain */
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${industryBadgeClass(b.industry)}`}
                  >
                    {b.industry}
                  </span>
                  <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-700">
                    {b.timeline || "—"}
                  </span>
                  <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-700">
                    {b.budget || "—"}
                  </span>
                </div>
                <p
                  className="text-sm text-gray-800 leading-relaxed mb-3"
                  title={b.cel_rd.length > 120 ? b.cel_rd : undefined}
                >
                  {truncate(b.cel_rd, 120)}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {b.wymagane_kompetencje
                    .filter(Boolean)
                    .slice(0, 3)
                    .map((k, i) => (
                      <span
                        key={i}
                        className="text-[11px] rounded-md bg-gray-100 text-gray-700 px-2 py-0.5"
                      >
                        {truncate(k, 48)}
                      </span>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Opublikowano {daysAgoLabel(b.published_at)}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/researcher/apply/${b.id}`}
                    className="inline-flex items-center justify-center rounded-lg border-2 border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    Złóż aplikację
                  </Link>
                  <Link
                    href={`/briefs/${b.id}`}
                    className="text-sm font-medium text-gray-700 hover:text-indigo-700 underline-offset-2 hover:underline"
                  >
                    Zobacz pełny brief
                  </Link>
                </div>
              </article>
            ))
          )}
        </main>

        <aside className="lg:w-1/3 shrink-0 order-1 lg:order-2">
          <div className="lg:sticky lg:top-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-6">
            <h2 className="text-sm font-semibold text-gray-900">Filtry</h2>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Branża</p>
              <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {filterIndustryOptions.map((ind: string) => (
                  <li key={ind}>
                    <label className="flex items-start gap-2 cursor-pointer text-sm text-gray-800">
                      <input
                        type="checkbox"
                        checked={industrySel.includes(ind)}
                        onChange={() => toggleIndustry(ind)}
                        className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-300"
                      />
                      <span>{ind}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <fieldset>
              <legend className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Horyzont
              </legend>
              <div className="space-y-2">
                {(
                  [
                    ["all", "Wszystkie"],
                    ["lt1m", "Do 1 miesiąca"],
                    ["1to3m", "1–3 miesiące"],
                    ["gt3m", "3+ miesięcy"],
                  ] as const
                ).map(([id, label]) => (
                  <label key={id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="timeline"
                      checked={timelineFilter === id}
                      onChange={() => setTimelineFilter(id)}
                      className="text-indigo-600 border-gray-300 focus:ring-indigo-300"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Budżet
              </legend>
              <div className="space-y-2">
                {(
                  [
                    ["all", "Wszystkie"],
                    ["lte20k", "Do 20 000 zł"],
                    ["gt20k", "Powyżej 20 000 zł"],
                  ] as const
                ).map(([id, label]) => (
                  <label key={id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="budget"
                      checked={budgetFilter === id}
                      onChange={() => setBudgetFilter(id)}
                      className="text-indigo-600 border-gray-300 focus:ring-indigo-300"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="button"
              onClick={clearFilters}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Wyczyść filtry
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
