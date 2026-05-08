"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type FavoriteBriefItem = {
  id: string;
  title: string;
  cel_rd: string;
  industry: string | null;
  timeline: string | null;
};

function truncate(text: string, maxLength: number): string {
  const t = text.trim();
  if (t.length <= maxLength) return t;
  return `${t.slice(0, maxLength - 1)}…`;
}

export default function FavoriteBriefsSection({ items }: { items: FavoriteBriefItem[] }) {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteBriefItem[]>(items);
  const [pending, setPending] = useState<Set<string>>(() => new Set());

  async function removeFavorite(briefId: string) {
    if (pending.has(briefId)) return;
    const previous = favorites;
    setPending((prev) => new Set(prev).add(briefId));
    setFavorites((prev) => prev.filter((b) => b.id !== briefId));
    try {
      const res = await fetch("/api/briefs/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId, favorite: false }),
      });
      if (!res.ok) throw new Error("favorite-remove-failed");
      router.refresh();
    } catch {
      setFavorites(previous);
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(briefId);
        return next;
      });
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Favorite briefs</h2>
          <p className="text-sm text-gray-600">Your saved briefs visible only on this account.</p>
        </div>
        <Link href="/briefs" className="text-sm font-medium text-indigo-600 hover:underline">
          Browse briefs
        </Link>
      </div>

      {favorites.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600">
          You do not have any favorite briefs yet.
        </p>
      ) : (
        <div className="space-y-3">
          {favorites.map((brief) => (
            <article key={brief.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap gap-2">
                    {brief.industry ? (
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs text-gray-700">
                        {brief.industry}
                      </span>
                    ) : null}
                    {brief.timeline ? (
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs text-gray-700">
                        {brief.timeline}
                      </span>
                    ) : null}
                  </div>
                  <p className="font-medium text-gray-900">{brief.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{truncate(brief.cel_rd, 160)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/briefs/${brief.id}`}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-100"
                  >
                    View brief
                  </Link>
                  <button
                    type="button"
                    onClick={() => void removeFavorite(brief.id)}
                    disabled={pending.has(brief.id)}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
