"use client";

import Link from "next/link";
import { useState } from "react";

type MatchDimensions = Record<string, { score: number; rationale: string }>;

const dimensionLabels: Record<string, string> = {
  domain_fit: "Dziedzina",
  skills_fit: "Kompetencje",
  availability_fit: "Dostępność",
  motivation_fit: "Motywacja",
};

export default function ApplyFormClient({
  briefId,
}: {
  briefId: string;
}) {
  const [coverMessage, setCoverMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{
    matchScore: number;
    matchExplanation: string;
    strengths: string[];
    risks: string[];
    dimensions?: MatchDimensions | null;
  } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (coverMessage.trim().length < 100 || coverMessage.trim().length > 800) {
      setError("Wiadomość musi mieć 100–800 znaków.");
      return;
    }
    if (!confirmed) {
      setError("Potwierdź zapoznanie z briefem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/applications/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefId,
          coverMessage: coverMessage.trim(),
          confirmed: true,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        matchScore?: number;
        matchExplanation?: string;
        strengths?: string[];
        risks?: string[];
        dimensions?: MatchDimensions | null;
      };
      if (!res.ok) {
        setError(data.error || "Nie udało się wysłać aplikacji.");
        return;
      }
      if (
        data.matchScore != null &&
        data.matchExplanation &&
        data.strengths &&
        data.risks
      ) {
        setSuccess({
          matchScore: data.matchScore,
          matchExplanation: data.matchExplanation,
          strengths: data.strengths,
          risks: data.risks,
          dimensions: data.dimensions ?? null,
        });
      }
    } catch {
      setError("Błąd sieci.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <p className="text-base font-medium text-gray-900">
          Aplikacja wysłana! Firma zostanie powiadomiona.
        </p>
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-2">
          <p className="text-sm">
            <span className="text-gray-600">Wynik dopasowania: </span>
            <span className="font-semibold text-indigo-700">{success.matchScore}/100</span>
          </p>
          <p className="text-sm text-gray-800 leading-relaxed">{success.matchExplanation}</p>
        </div>
        {success.dimensions ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {Object.entries(success.dimensions).map(([key, value]) => (
              <div key={key} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-gray-900">{dimensionLabels[key] ?? key}</p>
                  <span className="font-semibold text-indigo-700">{value.score}/100</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">{value.rationale}</p>
              </div>
            ))}
          </div>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="font-medium text-emerald-800 mb-1">Mocne strony</p>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              {success.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-amber-800 mb-1">Ryzyka / luki</p>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              {success.risks.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <Link
          href="/briefs"
          className="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          Wróć do listy briefów
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 outline-none";

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5"
    >
      <h2 className="text-lg font-semibold text-gray-900">Twoja aplikacja</h2>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="cover" className="block text-sm font-medium text-gray-700 mb-1">
          Twoja wiadomość do firmy <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Dlaczego pasujesz do tego projektu? (100–800 znaków)
        </p>
        <textarea
          id="cover"
          required
          minLength={100}
          maxLength={800}
          rows={6}
          value={coverMessage}
          onChange={(e) => setCoverMessage(e.target.value)}
          placeholder="Opisz konkretnie, jakie twoje kompetencje są przydatne dla tego projektu..."
          className={inputClass}
        />
        <p className="text-xs text-gray-500 mt-1">{coverMessage.trim().length} / 800 znaków</p>
      </div>

      <label className="flex gap-3 items-start cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-300"
        />
        <span className="text-sm text-gray-700">
          Potwierdzam, że zapoznałem/am się z briefem i mam czas na ten projekt
        </span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Wysyłanie…" : "Aplikuj na projekt"}
      </button>

      <p className="text-xs text-gray-500">
        Nie masz profilu?{" "}
        <Link href="/researcher/register" className="text-indigo-600 hover:underline">
          Zarejestruj się
        </Link>
      </p>
    </form>
  );
}
