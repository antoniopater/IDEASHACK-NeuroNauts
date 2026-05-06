"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ApplicationRow, ApplicationResearcherEmbed } from "@/lib/application-row";

export type { ApplicationRow };

function normalizeResearcher(r: ApplicationRow["researchers"]): ApplicationResearcherEmbed | null {
  if (!r) return null;
  return Array.isArray(r) ? r[0] ?? null : r;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function asDimensions(v: unknown): [string, { score: number; rationale: string }][] {
  if (!v || typeof v !== "object" || Array.isArray(v)) return [];
  return Object.entries(v as Record<string, unknown>).filter(
    (entry): entry is [string, { score: number; rationale: string }] => {
      const value = entry[1];
      return (
        Boolean(value) &&
        typeof value === "object" &&
        typeof (value as { score?: unknown }).score === "number" &&
        typeof (value as { rationale?: unknown }).rationale === "string"
      );
    }
  );
}

const dimensionLabels: Record<string, string> = {
  domain_fit: "Dziedzina",
  skills_fit: "Kompetencje",
  availability_fit: "Dostępność",
  motivation_fit: "Motywacja",
};

function stageLabel(stage: string): string {
  if (stage === "doktorant") return "Doktorant";
  if (stage === "ktor" || stage === "doktor") return "Kandydat na doktoranta";
  if (stage === "postdoc") return "Postdoc";
  return stage;
}

function formatStatus(status: string): string {
  if (status === "pending") return "oczekujące";
  if (status === "shortlisted") return "na shortliście";
  if (status === "rejected") return "odrzucone";
  return status;
}

function scoreBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-amber-400";
  return "bg-gray-400";
}

export default function ApplicationsManageClient({
  briefId,
  token,
  applications: initial,
}: {
  briefId: string;
  token: string;
  applications: ApplicationRow[];
}) {
  const [filter, setFilter] = useState<"all" | "shortlisted" | "pending">("all");
  const [apps, setApps] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const sorted = [...apps].sort((a, b) => (b.match_score ?? -1) - (a.match_score ?? -1));
    if (filter === "all") return sorted;
    return sorted.filter((a) => a.status === filter);
  }, [apps, filter]);

  async function setStatus(applicationId: string, status: "shortlisted" | "rejected") {
    setBusyId(applicationId);
    try {
      const res = await fetch("/api/applications/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, briefId, token, status }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        alert(j.error || "Wystąpił błąd. Spróbuj ponownie.");
        return;
      }
      setApps((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Wszystkie"],
            ["shortlisted", "Shortlista"],
            ["pending", "Oczekujące"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${
              filter === id
                ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className="text-gray-600 text-sm">Brak aplikacji w tym widoku.</p>
        ) : (
          filtered.map((app) => {
            const res = normalizeResearcher(app.researchers);
            const score = Math.round(app.match_score ?? 0);
            const strengths = asStringArray(app.match_strengths);
            const risks = asStringArray(app.match_risks);
            const dimensions = asDimensions(app.match_dimensions);
            const hours = res?.availability_hours_per_week;
            const modes = res?.availability_modes?.length
              ? res.availability_modes.join(", ")
              : "—";

            return (
              <article
                key={app.id}
                className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {res ? `${res.first_name} ${res.last_name}` : "Badacz"}
                    </h2>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {res?.institution ?? "—"}
                    </p>
                    {res ? (
                      <span className="inline-flex mt-2 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
                        {stageLabel(res.stage)}
                      </span>
                    ) : null}
                  </div>
                  <div
                    className="sm:text-right sm:min-w-[140px]"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={score}
                    aria-label={`Wynik dopasowania do projektu: ${score} punktów na sto`}
                  >
                    <p className="text-xs text-gray-500 mb-1">Dopasowanie</p>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${scoreBarColor(score)}`}
                        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mt-1">{score}/100</p>
                  </div>
                </div>

                <p className="text-sm text-gray-800 mt-4 leading-relaxed">
                  {app.match_explanation ?? "—"}
                </p>

                {dimensions.length > 0 ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                    {dimensions.map(([key, value]) => (
                      <div key={key} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-gray-700">
                            {dimensionLabels[key] ?? key}
                          </p>
                          <span className="text-xs font-semibold text-indigo-700">
                            {value.score}/100
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-gray-600">
                          {value.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 mb-2">Mocne strony</p>
                    <ul className="space-y-1">
                      {strengths.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-emerald-600 shrink-0">✓</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-800 mb-2">Ryzyka</p>
                    <ul className="space-y-1">
                      {risks.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-amber-600 shrink-0">⚠</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  Dostępność: {hours != null ? `${hours} h/tydz.` : "—"} · tryby: {modes}
                </p>

                <details className="mt-4 group border-t border-gray-100 pt-3">
                  <summary className="cursor-pointer text-sm font-medium text-indigo-600 list-none flex items-center gap-2">
                    <span className="select-none group-open:rotate-90 transition-transform">▸</span>
                    Wiadomość od badacza
                  </summary>
                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap pl-6">
                    {app.cover_message ?? "—"}
                  </p>
                </details>

                <div className="flex flex-wrap gap-3 mt-5">
                  {res ? (
                    <Link
                      href={`/researcher/${res.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Zobacz pełny profil
                    </Link>
                  ) : null}
                  {app.status !== "shortlisted" ? (
                    <button
                      type="button"
                      disabled={busyId === app.id}
                      onClick={() => setStatus(app.id, "shortlisted")}
                      className="rounded-lg border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                    >
                      Shortlista
                    </button>
                  ) : null}
                  {app.status !== "rejected" ? (
                    <button
                      type="button"
                      disabled={busyId === app.id}
                      onClick={() => setStatus(app.id, "rejected")}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Odrzuć
                    </button>
                  ) : null}
                  <span className="text-xs text-gray-500 self-center ml-auto">
                    Status: <strong>{formatStatus(app.status)}</strong>
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
