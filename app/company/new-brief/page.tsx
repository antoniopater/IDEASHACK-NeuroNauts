"use client";

import {
  type AiBriefContent,
  budgetOptions,
  deriveBriefTitle,
  industryOptions,
  timelineOptions,
} from "@/lib/brief-schema";
import Link from "next/link";
import { ResearcherPreviewPanel } from "@/components/shared/researcher-preview-panel";
import { useCallback, useEffect, useState } from "react";

type Step = 1 | 2 | 3;

const emptyBrief: AiBriefContent = {
  cel_rd: "",
  wymagane_kompetencje: [],
  zakres_projektu: "",
  oczekiwany_rezultat: "",
  pierwszy_milestone: "",
  suggested_researcher_profile: "",
};

const companyTestPayload = {
  problem:
    "Produkujemy moduły elektroniki mocy i chcemy ograniczyc zuzycie energii oraz odsetek reklamacji po testach koncowych. Obecnie nie umiemy dobrze przewidywac awarii i nie mamy modelu, ktory laczy dane z linii SMT, testow EOL oraz warunkow magazynowania.",
  expectedResult:
    "Dzialajacy proof-of-concept predykcji ryzyka awarii + plan wdrozenia monitoringu procesu i rekomendacje parametrow technologicznych.",
  companyName: "NeuroNauts Manufacturing",
  brief: {
    cel_rd:
      "Zaprojektowac i zweryfikowac podejscie do predykcji awarii oraz obnizenia zuzycia energii w procesie produkcji elektroniki mocy.",
    wymagane_kompetencje: [
      "Analiza danych procesowych i telemetrycznych (Python, SQL)",
      "Modelowanie statystyczne i uczenie maszynowe dla predykcji jakosci",
      "Znajomosc procesow produkcyjnych elektroniki (SMT/EOL) i DOE",
      "Umiejetnosc przekladania wynikow badan na rekomendacje wdrozeniowe",
    ],
    zakres_projektu:
      "Audyt danych historycznych, przygotowanie cech, budowa modeli predykcyjnych, walidacja na partiach produkcyjnych i przygotowanie planu integracji z obecnym raportowaniem.",
    oczekiwany_rezultat:
      "Raport z metrykami modelu, lista kluczowych czynnikow ryzyka, rekomendacje zmian procesu oraz backlog krokow wdrozeniowych na kolejne 8 tygodni.",
    pierwszy_milestone:
      "W ciagu 2 tygodni: konsolidacja danych z 3 zrodel i baseline model do predykcji awarii.",
    suggested_researcher_profile:
      "Doktorant lub postdoc z doswiadczeniem w data science dla produkcji, modelowaniu procesow i pracy z danymi przemyslowymi.",
  } satisfies AiBriefContent,
};

function StepIndicator({ step }: { step: Step }) {
  const items: { n: Step; label: string }[] = [
    { n: 1, label: "Problem description" },
    { n: 2, label: "R&D Brief" },
    { n: 3, label: "Publish" },
  ];
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {items.map((item, i) => (
          <div key={item.n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold border-2 transition-colors ${
                  step >= item.n
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-300 bg-white text-gray-500"
                }`}
              >
                {item.n}
              </div>
              <span className="hidden sm:block text-xs text-gray-600 text-center max-w-[6.5rem] leading-tight">
                {item.label}
              </span>
            </div>
            {i < items.length - 1 ? (
              <div
                className={`h-0.5 flex-1 mx-2 sm:mx-4 rounded ${step > item.n ? "bg-indigo-600" : "bg-gray-200"}`}
                aria-hidden
              />
            ) : null}
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-gray-500 mt-4 sm:hidden">
        Step {step} of 3
      </p>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-5 w-40 rounded bg-gray-200" />
      <div className="h-24 w-full rounded-lg bg-gray-200" />
    </div>
  );
}

export default function NewBriefPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const [problem, setProblem] = useState("");
  const [industry, setIndustry] = useState("");
  const [timeline, setTimeline] = useState<(typeof timelineOptions)[number] | "">("");
  const [budget, setBudget] = useState("");
  const [expectedResult, setExpectedResult] = useState("");

  const [brief, setBrief] = useState<AiBriefContent>(emptyBrief);

  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [successBriefId, setSuccessBriefId] = useState<string | null>(null);
  const [successManageUrl, setSuccessManageUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch("/api/auth/me");
        const data = (await res.json()) as {
          user?: { email?: string; role?: "company" | "researcher" } | null;
        };
        if (!data.user) {
          setAuthError("To publish briefs, please sign in with a company account.");
          return;
        }
        if (data.user.role !== "company") {
          setAuthError("This account does not have a company role. Please sign in with a company account.");
          return;
        }
        setCompanyEmail(data.user.email ?? "");
      } catch {
        setAuthError("Could not verify session. Refresh the page and try again.");
      } finally {
        setAuthLoading(false);
      }
    }
    void loadMe();
  }, []);

  function fillCompanyTestData() {
    setStep1Error(null);
    setGenError(null);
    setPublishError(null);
    setProblem(companyTestPayload.problem);
    setIndustry(industryOptions[0] ?? "");
    setTimeline(timelineOptions[1] ?? timelineOptions[0] ?? "");
    setBudget(budgetOptions[2] ?? budgetOptions[0] ?? "");
    setExpectedResult(companyTestPayload.expectedResult);
    setBrief(companyTestPayload.brief);
    setCompanyName(companyTestPayload.companyName);
    setConfirmPublish(true);
    setStep(3);
  }

  const runGenerate = useCallback(async () => {
    setGenError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/briefs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: problem.trim(),
          industry,
          timeline,
          budget,
          expected_result: expectedResult.trim(),
        }),
      });
      const data = (await res.json()) as { brief?: AiBriefContent; error?: string };
      if (!res.ok) {
        setGenError(data.error || "Failed to generate brief.");
        setBrief(emptyBrief);
        return;
      }
      if (data.brief) setBrief(data.brief);
    } catch {
      setGenError("Network error. Check connection and try again.");
      setBrief(emptyBrief);
    } finally {
      setGenerating(false);
    }
  }, [problem, industry, timeline, budget, expectedResult]);

  async function handleStep1Next(e: React.FormEvent) {
    e.preventDefault();
    setStep1Error(null);
    if (problem.trim().length < 50) {
      setStep1Error("Problem description must be at least 50 characters.");
      return;
    }
    if (!industry) {
      setStep1Error("Select industry.");
      return;
    }
    if (!timeline) {
      setStep1Error("Wybierz horyzont czasowy.");
      return;
    }
    if (!budget) {
      setStep1Error("Wybierz orientacyjny budżet.");
      return;
    }
    setStep(2);
    await runGenerate();
  }

  function updateCompetence(index: number, value: string) {
    setBrief((b) => {
      const next = [...b.wymagane_kompetencje];
      next[index] = value;
      return { ...b, wymagane_kompetencje: next };
    });
  }

  function addCompetence() {
    setBrief((b) => ({ ...b, wymagane_kompetencje: [...b.wymagane_kompetencje, ""] }));
  }

  function removeCompetence(index: number) {
    setBrief((b) => ({
      ...b,
      wymagane_kompetencje: b.wymagane_kompetencje.filter((_, i) => i !== index),
    }));
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setPublishError(null);
    if (!companyName.trim()) {
      setPublishError("Podaj nazwę firmy.");
      return;
    }
    if (!companyEmail.trim()) {
      setPublishError("Podaj adres e-mail.");
      return;
    }
    if (!confirmPublish) {
      setPublishError("Zaznacz potwierdzenie publikacji.");
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch("/api/briefs/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          companyEmail: companyEmail.trim(),
          rawInput: {
            problem: problem.trim(),
            industry,
            timeline,
            budget,
            expected_result: expectedResult.trim(),
          },
          finalContent: brief,
        }),
      });
      const data = (await res.json()) as {
        briefId?: string;
        applicationsManageUrl?: string;
        error?: string;
      };
      if (!res.ok) {
        setPublishError(data.error || "Publikacja nie powiodła się.");
        return;
      }
      if (data.briefId) {
        setSuccessBriefId(data.briefId);
        setSuccessManageUrl(data.applicationsManageUrl ?? null);
      }
    } catch {
      setPublishError("Błąd sieci. Spróbuj ponownie.");
    } finally {
      setPublishing(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 outline-none transition-shadow";

  if (successBriefId) {
    return (
      <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)] py-12 px-4">
        <div className="max-w-lg mx-auto rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Brief published</h1>
          <p className="text-gray-600 text-sm mb-6">
            Twój brief jest już widoczny dla badaczy. Identyfikator:{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{successBriefId}</code>
          </p>
          <Link
            href={`/briefs/${successBriefId}`}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            View brief
          </Link>
          {successManageUrl ? (
            <Link
              href={successManageUrl}
              className="ml-3 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
            >
              Zarządzaj aplikacjami
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)] py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="mb-2 text-center sm:text-left">
          <h1 className="text-2xl font-semibold text-gray-900">New R&D brief</h1>
          <p className="text-sm text-gray-600 mt-1">
            Describe your problem — we generate a brief researchers understand.
          </p>
          <button
            type="button"
            onClick={fillCompanyTestData}
            className="mt-4 inline-flex items-center justify-center rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            Fill demo data (full)
          </button>
        </header>

        <StepIndicator step={step} />

        {authLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <p className="text-sm text-gray-600">Sprawdzam sesje...</p>
          </div>
        ) : authError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 sm:p-8 shadow-sm">
            <p className="text-sm text-red-700">{authError}</p>
            <Link href="/auth/sign-in" className="mt-3 inline-block text-sm font-medium text-indigo-600">
              Przejdz do logowania
            </Link>
          </div>
        ) : null}

        {!authLoading && !authError && step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <form onSubmit={handleStep1Next} className="lg:col-span-3 space-y-6 rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900">Describe your R&D problem</h2>
            {step1Error ? (
              <p className="text-sm text-red-600" role="alert">
                {step1Error}
              </p>
            ) : null}
            <div>
              <label htmlFor="problem" className="block text-sm font-medium text-gray-700 mb-1">
                Opisz problem lub wyzwanie technologiczne <span className="text-red-500">*</span>
              </label>
              <textarea
                id="problem"
                required
                minLength={50}
                rows={5}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Np. Mamy problem z optymalizacją zużycia energii w hali produkcyjnej. Tradycyjne metody nie wystarczają..."
                className={inputClass}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 50 znaków ({problem.trim().length}/50)
              </p>
            </div>
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                Industry <span className="text-red-500">*</span>
              </label>
              <select
                id="industry"
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={inputClass}
              >
                <option value="">— Wybierz —</option>
                {industryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Horyzont czasowy projektu <span className="text-red-500">*</span>
              </legend>
              <div className="space-y-2">
                {timelineOptions.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="timeline"
                      value={opt}
                      checked={timeline === opt}
                      onChange={() => setTimeline(opt)}
                      className="text-indigo-600 border-gray-300 focus:ring-indigo-300"
                    />
                    <span className="text-sm text-gray-800">{opt}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                Orientacyjny budżet <span className="text-red-500">*</span>
              </label>
              <select
                id="budget"
                required
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={inputClass}
              >
                <option value="">— Wybierz —</option>
                {budgetOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="expected" className="block text-sm font-medium text-gray-700 mb-1">
                Expected result
              </label>
              <textarea
                id="expected"
                rows={3}
                value={expectedResult}
                onChange={(e) => setExpectedResult(e.target.value)}
                placeholder="Np. Raport z rekomendacjami, działający prototyp, analiza literatury..."
                className={inputClass}
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                Generuj brief
              </button>
            </div>
          </form>
          {/* Live researcher preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Live researcher matches</h3>
              <p className="text-xs text-gray-500 mb-3">Updates as you type your problem description</p>
              <ResearcherPreviewPanel problem={problem} domain={industry} />
            </div>
          </div>
          </div>
        )}

        {!authLoading && !authError && step === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-medium text-gray-900">Twój brief R&D</h2>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => runGenerate()}
                  disabled={generating}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                >
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Wróć do edycji
                </button>
              </div>
            </div>
            {genError ? (
              <p className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 p-3" role="alert">
                {genError}
              </p>
            ) : null}

            {generating ? (
              <div className="space-y-6 rounded-xl border border-gray-200 bg-gray-50 p-6">
                <SectionSkeleton />
                <SectionSkeleton />
                <SectionSkeleton />
                <SectionSkeleton />
                <SectionSkeleton />
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 sm:p-6 space-y-6">
                  <section>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">R&D Goal</h3>
                    <textarea
                      value={brief.cel_rd}
                      onChange={(e) => setBrief((b) => ({ ...b, cel_rd: e.target.value }))}
                      rows={4}
                      className={`${inputClass} min-h-[5rem]`}
                    />
                  </section>
                  <section>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Required competencies</h3>
                    <ul className="space-y-2">
                      {brief.wymagane_kompetencje.map((line, idx) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <span className="mt-2 text-gray-400 select-none">•</span>
                          <textarea
                            value={line}
                            onChange={(e) => updateCompetence(idx, e.target.value)}
                            rows={2}
                            className={`${inputClass} flex-1 min-h-[2.75rem] resize-y`}
                          />
                          <button
                            type="button"
                            onClick={() => removeCompetence(idx)}
                            className="mt-1 text-xs text-gray-500 hover:text-red-600 px-2 py-1"
                            aria-label="Usuń punkt"
                          >
                            Usuń
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={addCompetence}
                      className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      + Dodaj kompetencję
                    </button>
                  </section>
                  <section>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Project scope</h3>
                    <textarea
                      value={brief.zakres_projektu}
                      onChange={(e) => setBrief((b) => ({ ...b, zakres_projektu: e.target.value }))}
                      rows={4}
                      className={`${inputClass} min-h-[5rem]`}
                    />
                  </section>
                  <section>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Expected result</h3>
                    <textarea
                      value={brief.oczekiwany_rezultat}
                      onChange={(e) => setBrief((b) => ({ ...b, oczekiwany_rezultat: e.target.value }))}
                      rows={4}
                      className={`${inputClass} min-h-[5rem]`}
                    />
                  </section>
                  <section>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">First milestone</h3>
                    <textarea
                      value={brief.pierwszy_milestone}
                      onChange={(e) => setBrief((b) => ({ ...b, pierwszy_milestone: e.target.value }))}
                      rows={3}
                      className={`${inputClass} min-h-[4rem]`}
                    />
                  </section>
                  <section>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Researcher profile (sugestia AI)</h3>
                    <textarea
                      value={brief.suggested_researcher_profile}
                      onChange={(e) =>
                        setBrief((b) => ({ ...b, suggested_researcher_profile: e.target.value }))
                      }
                      rows={3}
                      className={`${inputClass} min-h-[4rem]`}
                    />
                  </section>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                  >
                    Dalej: potwierdź i opublikuj
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {!authLoading && !authError && step === 3 && (
          <form
            onSubmit={handlePublish}
            className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm"
          >
            <h2 className="text-lg font-medium text-gray-900">Potwierdź i opublikuj</h2>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4 text-sm text-gray-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Podgląd briefu</p>
              <h3 className="text-base font-semibold text-gray-900">{deriveBriefTitle(brief.cel_rd)}</h3>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-700">
                  {industry}
                </span>
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-700">
                  {timeline}
                </span>
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-700">
                  {budget}
                </span>
              </div>
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <p className="whitespace-pre-wrap">
                  <strong className="text-gray-900">R&D Goal:</strong> {brief.cel_rd}
                </p>
                <div>
                  <strong className="text-gray-900 block mb-1">Required competencies</strong>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {brief.wymagane_kompetencje.filter(Boolean).map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
                <p className="whitespace-pre-wrap">
                  <strong className="text-gray-900">Zakres:</strong> {brief.zakres_projektu}
                </p>
                <p className="whitespace-pre-wrap">
                  <strong className="text-gray-900">Expected result:</strong> {brief.oczekiwany_rezultat}
                </p>
                <p className="whitespace-pre-wrap">
                  <strong className="text-gray-900">First milestone:</strong> {brief.pierwszy_milestone}
                </p>
                {brief.suggested_researcher_profile ? (
                  <p className="whitespace-pre-wrap">
                    <strong className="text-gray-900">Researcher profile:</strong>{" "}
                    {brief.suggested_researcher_profile}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <label htmlFor="coName" className="block text-sm font-medium text-gray-700 mb-1">
                Company name <span className="text-red-500">*</span>
              </label>
              <input
                id="coName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                autoComplete="organization"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="coEmail" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail firmowy <span className="text-red-500">*</span>
              </label>
              <input
                id="coEmail"
                type="email"
                value={companyEmail}
                readOnly
                autoComplete="email"
                className={inputClass}
              />
            </div>
            <label className="flex gap-3 items-start cursor-pointer">
              <input
                type="checkbox"
                checked={confirmPublish}
                onChange={(e) => setConfirmPublish(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-300"
              />
              <span className="text-sm text-gray-700">
                Potwierdzam, że chcę opublikować ten brief i otrzymywać zgłoszenia od badaczy
              </span>
            </label>
            {publishError ? (
              <p className="text-sm text-red-600" role="alert">
                {publishError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3 justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                ← Wróć do edycji briefu
              </button>
              <button
                type="submit"
                disabled={publishing}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {publishing ? "Publikuję…" : "Publish brief"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
