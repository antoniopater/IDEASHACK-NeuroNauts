"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type UseFormRegister,
} from "react-hook-form";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";
import {
  availabilityModeOptions,
  projectTypeOptions,
  researchDomainOptions,
  skillSuggestions,
  stageOptions,
} from "@/lib/researcher-options";
import {
  type ProfileBuilderResponse,
  type ResearcherRegistrationInput,
  researcherRegistrationSchema,
} from "@/lib/validations";

type FormValues = ResearcherRegistrationInput;

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 outline-none transition-shadow";

const sectionHeaderClass =
  "text-sm font-medium text-gray-500 uppercase tracking-wide border-t border-gray-100 pt-6 mt-6";

const labelClass = "block text-sm font-medium text-gray-700 mb-1";

const errorClass = "mt-1 text-xs text-red-600";

const helpClass = "mt-1 text-xs text-gray-500";

const currentYear = new Date().getFullYear();

const emptyProject = {
  title: "",
  description: "",
  type: undefined as FormValues["projects"][number]["type"],
  year_from: undefined as number | undefined,
  year_to: undefined as number | undefined,
};

const researcherTestData = {
  first_name: "Anna",
  last_name: "Kowalska",
  email: "anna.kowalska.demo@neuronauts.pl",
  institution: "Warsaw University of Technology, Faculty of Electronics and Information Technology",
  phd_start_year: Math.max(2010, currentYear - 2),
  research_subdomain: "Predictive maintenance and analysis of production data",
  research_description:
    "I work on failure prediction models and optimization of industrial process parameters. I combine statistical methods, machine learning, and causal analysis to improve product quality and shorten response time to process deviations.",
  practical_skills: [
    "Data analysis (Python/R)",
    "Statistical modeling",
    "Design of experiments",
    "Technical reporting",
  ],
  projects: [
    {
      title: "Failure prediction model for an SMT assembly line",
      description:
        "Built a data pipeline and a classification model that estimates defect risk at end-of-line testing.",
      type: "research" as const,
      year_from: currentYear - 2,
      year_to: currentYear - 1,
    },
    {
      title: "Industry collaboration on energy use optimization",
      description:
        "Defined KPIs and recommended process parameter changes that reduced energy consumption.",
      type: "industry" as const,
      year_from: currentYear - 1,
      year_to: currentYear,
    },
  ],
  availability_hours_per_week: 16,
  availability_modes: ["consultation", "proof_of_concept", "small_rd_project"] as const,
  motivation:
    "I want to work with industry because I care about applying research outcomes in practice and delivering measurable business impact. I can translate complex results into engineering decisions, iterate quickly on hypotheses, and collaborate in cross-functional teams, bridging academic rigor with operational constraints.",
  publication_links: [
    "https://scholar.google.com/citations?user=demoResearcher",
    "https://orcid.org/0000-0002-1825-0097",
  ],
  profileSource:
    "PhD researcher focused on failure prediction and optimization of industrial processes. I work with production data, combining ML, statistical methods, and process experiments. I have delivered research and implementation projects with companies and produce technical reports and rollout recommendations.",
};

const WIZARD_STEPS = [
  { n: 1, label: "Basic info" },
  { n: 2, label: "Research & Skills" },
  { n: 3, label: "Projects & Availability" },
] as const;

export default function ResearcherRegisterPage() {
  const router = useRouter();
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [profileSource, setProfileSource] = useState("");
  const [profileBuildError, setProfileBuildError] = useState<string | null>(null);
  const [profileBuildLoading, setProfileBuildLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitted },
  } = useForm<FormValues>({
    resolver: zodResolver(researcherRegistrationSchema),
    mode: "onSubmit",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      institution: "",
      phd_start_year: undefined,
      stage: undefined,
      research_domain: undefined,
      research_subdomain: "",
      research_description: "",
      practical_skills: [],
      projects: [{ ...emptyProject }],
      availability_hours_per_week: 8,
      availability_modes: [],
      motivation: "",
      publication_links: ["", ""],
    },
  });

  const formSnapshot = useWatch({ control });
  const completenessPreview = useMemo(
    () =>
      calculateProfileCompleteness({
        first_name: formSnapshot?.first_name,
        last_name: formSnapshot?.last_name,
        institution: formSnapshot?.institution,
        phd_start_year: formSnapshot?.phd_start_year,
        stage: formSnapshot?.stage,
        research_description: formSnapshot?.research_description,
        practical_skills: formSnapshot?.practical_skills,
        projects: formSnapshot?.projects,
        motivation: formSnapshot?.motivation,
        availability_hours_per_week: formSnapshot?.availability_hours_per_week,
        availability_modes: formSnapshot?.availability_modes,
        publication_links: formSnapshot?.publication_links,
      }),
    [formSnapshot]
  );

  const projects = useFieldArray({ control, name: "projects" });
  const publicationLinks = useFieldArray({
    control,
    name: "publication_links" as never,
  });

  const skills = (watch("practical_skills") as string[] | undefined) ?? [];
  const motivation = watch("motivation") ?? "";
  const hours = watch("availability_hours_per_week") ?? 8;
  const description = watch("research_description") ?? "";
  const selectedModes = (watch("availability_modes") as string[] | undefined) ?? [];

  const skillInputRef = useRef<HTMLInputElement | null>(null);

  function addSkill(raw: string) {
    const value = raw.trim();
    if (!value) return;
    const current = (getValues("practical_skills") as string[] | undefined) ?? [];
    if (current.some((s) => s.toLowerCase() === value.toLowerCase())) return;
    if (current.length >= 20) return;
    setValue("practical_skills", [...current, value], {
      shouldValidate: isSubmitted,
      shouldDirty: true,
    });
    if (skillInputRef.current) skillInputRef.current.value = "";
  }

  function removeSkill(idx: number) {
    const current = (getValues("practical_skills") as string[] | undefined) ?? [];
    setValue(
      "practical_skills",
      current.filter((_, i) => i !== idx),
      { shouldValidate: isSubmitted, shouldDirty: true }
    );
  }

  function toggleMode(value: string, checked: boolean) {
    const current = (getValues("availability_modes") as string[] | undefined) ?? [];
    const next = checked
      ? Array.from(new Set([...current, value]))
      : current.filter((m) => m !== value);
    setValue("availability_modes", next as FormValues["availability_modes"], {
      shouldValidate: isSubmitted,
      shouldDirty: true,
    });
  }

  function applyProfileSuggestion(profile: ProfileBuilderResponse) {
    setValue("research_subdomain", profile.research_subdomain ?? "", {
      shouldDirty: true,
      shouldValidate: isSubmitted,
    });
    setValue("research_description", profile.research_description, {
      shouldDirty: true,
      shouldValidate: isSubmitted,
    });
    setValue("practical_skills", profile.practical_skills, {
      shouldDirty: true,
      shouldValidate: isSubmitted,
    });
    setValue("projects", profile.projects.map((p) => ({ ...emptyProject, ...p })), {
      shouldDirty: true,
      shouldValidate: isSubmitted,
    });
    setValue("motivation", profile.motivation, {
      shouldDirty: true,
      shouldValidate: isSubmitted,
    });
    setValue("publication_links", profile.publication_links.length > 0 ? profile.publication_links : [""], {
      shouldDirty: true,
      shouldValidate: isSubmitted,
    });
  }

  async function runProfileBuilder() {
    setProfileBuildError(null);
    if (profileSource.trim().length < 80) {
      setProfileBuildError("Paste at least 80 characters from your description, CV excerpt, or notes.");
      return;
    }
    setProfileBuildLoading(true);
    try {
      const currentLinks = (getValues("publication_links") ?? []).filter(
        (u): u is string => typeof u === "string" && u.trim().length > 0
      );
      const res = await fetch("/api/researcher/profile-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: profileSource.trim(),
          stage: getValues("stage"),
          research_domain: getValues("research_domain"),
          publication_links: currentLinks,
        }),
      });
      const data = (await res.json()) as {
        profile?: ProfileBuilderResponse;
        error?: string;
      };
      if (!res.ok || !data.profile) {
        setProfileBuildError(data.error || "Failed to build profile.");
        return;
      }
      applyProfileSuggestion(data.profile);
    } catch {
      setProfileBuildError("Network error. Please try again.");
    } finally {
      setProfileBuildLoading(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const cleanedLinks = (values.publication_links ?? []).filter(
        (u): u is string => typeof u === "string" && u.trim().length > 0
      );
      const payload = { ...values, publication_links: cleanedLinks };
      const res = await fetch("/api/researcher/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        researcherId?: string;
        error?: string;
      };
      if (!res.ok) {
        setServerError(data.error || "Failed to register profile.");
        return;
      }
      if (data.researcherId) {
        router.push(`/researcher/${data.researcherId}/dashboard`);
      }
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const motivationCount = motivation.length;

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch("/api/auth/me");
        const data = (await res.json()) as {
          user?: {
            email?: string;
            role?: "company" | "researcher";
            institutionVerified?: boolean;
          } | null;
        };
        if (!data.user) {
          setAuthError("To complete your researcher profile, please sign in with a researcher account.");
          return;
        }
        if (data.user.role !== "researcher") {
          setAuthError("This account does not have a researcher role.");
          return;
        }
        if (!data.user.institutionVerified) {
          setAuthError("Researcher account requires institutional affiliation verification.");
          return;
        }
        setValue("email", data.user.email ?? "", { shouldDirty: false });
      } catch {
        setAuthError("Could not verify session. Refresh and try again.");
      } finally {
        setAuthLoading(false);
      }
    }
    void loadMe();
  }, [setValue]);

  function fillResearcherTestData() {
    setServerError(null);
    setProfileBuildError(null);
    setProfileSource(researcherTestData.profileSource);

    setValue("first_name", researcherTestData.first_name, { shouldDirty: true });
    setValue("last_name", researcherTestData.last_name, { shouldDirty: true });
    setValue("email", researcherTestData.email, { shouldDirty: true });
    setValue("institution", researcherTestData.institution, { shouldDirty: true });
    setValue("phd_start_year", researcherTestData.phd_start_year, { shouldDirty: true });
    setValue("stage", stageOptions[0]?.value, { shouldDirty: true });
    setValue("research_domain", researchDomainOptions[2] ?? researchDomainOptions[0], { shouldDirty: true });
    setValue("research_subdomain", researcherTestData.research_subdomain, { shouldDirty: true });
    setValue("research_description", researcherTestData.research_description, { shouldDirty: true });
    setValue("practical_skills", [...researcherTestData.practical_skills], { shouldDirty: true });
    setValue("projects", [...researcherTestData.projects], { shouldDirty: true });
    setValue("availability_hours_per_week", researcherTestData.availability_hours_per_week, {
      shouldDirty: true,
    });
    setValue("availability_modes", [...researcherTestData.availability_modes], { shouldDirty: true });
    setValue("motivation", researcherTestData.motivation, { shouldDirty: true });
    setValue("publication_links", [...researcherTestData.publication_links], { shouldDirty: true });
  }

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Researcher profile</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create a profile so companies can find you for R&D projects.
          </p>
          <button
            type="button"
            onClick={fillResearcherTestData}
            className="mt-4 inline-flex items-center justify-center rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            Fill demo data (full)
          </button>
          {/* Wizard step indicator */}
          <div className="mt-6 flex items-center gap-0">
            {WIZARD_STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    wizardStep > s.n ? "bg-indigo-600 border-indigo-600 text-white" :
                    wizardStep === s.n ? "bg-white border-indigo-600 text-indigo-600" :
                    "bg-white border-gray-300 text-gray-400"
                  }`}>
                    {wizardStep > s.n ? "✓" : s.n}
                  </div>
                  <span className={`text-[10px] font-medium whitespace-nowrap ${wizardStep === s.n ? "text-indigo-700" : "text-gray-400"}`}>{s.label}</span>
                </div>
                {i < WIZARD_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded ${wizardStep > s.n ? "bg-indigo-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Completeness bar */}
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
              <span>Profile completeness</span>
              <span className="font-semibold text-gray-900">{completenessPreview.score}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-600 transition-all duration-500" style={{ width: `${completenessPreview.score}%` }} />
            </div>
          </div>
        </header>

        {authLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <p className="text-sm text-gray-600">Checking session...</p>
          </div>
        ) : authError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 sm:p-8 shadow-sm">
            <p className="text-sm text-red-700">{authError}</p>
            <Link href="/auth/sign-in" className="mt-3 inline-block text-sm font-medium text-indigo-600">
              Go to sign in
            </Link>
          </div>
        ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm"
          noValidate
        >
          {wizardStep === 1 && (<>
          <section className="mb-8 rounded-xl border border-indigo-100 bg-indigo-50/60 p-5">
            <h2 className="text-base font-semibold text-gray-900">AI Profile Builder</h2>
            <p className="mt-1 text-sm text-gray-600">
              Paste a research summary, CV excerpt, paper abstract, or notes. AI will map them to profile
              fields you can refine afterward.
            </p>
            <textarea
              rows={6}
              value={profileSource}
              onChange={(e) => setProfileSource(e.target.value)}
              placeholder="E.g. I optimize service routing; I have used OR-Tools and Python..."
              className={`${inputClass} mt-4 bg-white`}
            />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                {profileSource.trim().length}/80 characters minimum
              </p>
              <button
                type="button"
                onClick={runProfileBuilder}
                disabled={profileBuildLoading}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {profileBuildLoading ? "Building profile..." : "Fill form with AI"}
              </button>
            </div>
            {profileBuildError ? (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {profileBuildError}
              </p>
            ) : null}
          </section>

          {/* SECTION 1: Basic information */}
          <h2 className={sectionHeaderClass + " !mt-0 !border-t-0 !pt-0"}>
            Basic information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div>
              <label htmlFor="first_name" className={labelClass}>
                First name <span className="text-red-500">*</span>
              </label>
              <input
                id="first_name"
                type="text"
                autoComplete="given-name"
                className={inputClass}
                {...register("first_name")}
              />
              {errors.first_name ? (
                <p className={errorClass}>{errors.first_name.message}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="last_name" className={labelClass}>
                Last name <span className="text-red-500">*</span>
              </label>
              <input
                id="last_name"
                type="text"
                autoComplete="family-name"
                className={inputClass}
                {...register("last_name")}
              />
              {errors.last_name ? (
                <p className={errorClass}>{errors.last_name.message}</p>
              ) : null}
            </div>
          </div>
          <div className="pt-4">
            <label htmlFor="email" className={labelClass}>
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={inputClass}
              readOnly
              {...register("email")}
            />
            {errors.email ? (
              <p className={errorClass}>{errors.email.message}</p>
            ) : null}
          </div>
          <div className="pt-4">
            <label htmlFor="institution" className={labelClass}>
              University / institute <span className="text-red-500">*</span>
            </label>
            <input
              id="institution"
              type="text"
              autoComplete="organization"
              placeholder="e.g. University of Warsaw, Faculty of Mechatronics"
              className={inputClass}
              {...register("institution")}
            />
            {errors.institution ? (
              <p className={errorClass}>{errors.institution.message}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div>
              <label htmlFor="phd_start_year" className={labelClass}>
                PhD start year{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="phd_start_year"
                type="number"
                min={2010}
                max={currentYear}
                className={inputClass}
                {...register("phd_start_year", { valueAsNumber: true })}
              />
              {errors.phd_start_year ? (
                <p className={errorClass}>{errors.phd_start_year.message}</p>
              ) : null}
            </div>
            <div>
              <span className={labelClass}>
                Stage <span className="text-red-500">*</span>
              </span>
              <div className="flex flex-col gap-1 pt-1">
                {stageOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 cursor-pointer text-sm text-gray-800"
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      className="text-indigo-600 border-gray-300 focus:ring-indigo-300"
                      {...register("stage")}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
              {errors.stage ? (
                <p className={errorClass}>{errors.stage.message}</p>
              ) : null}
            </div>
          </div>


          {/* Wizard navigation */}
          <div className="mt-8 flex items-center justify-between gap-3 pt-6 border-t border-gray-100">
            {wizardStep > 1 ? (
              <button type="button" onClick={() => setWizardStep((s) => Math.max(1, s - 1) as 1|2|3)}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                ← Back
              </button>
            ) : <span />}
            {wizardStep < 3 ? (
              <button type="button" onClick={() => setWizardStep((s) => Math.min(3, s + 1) as 1|2|3)}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
                Next: {wizardStep === 1 ? "Research & Skills" : "Projects & Availability"} →
              </button>
            ) : null}
          </div>
          </>) /* end step 1 */}
          {wizardStep === 2 && (<>
          {/* SECTION 2: Research focus */}
          <h2 className={sectionHeaderClass}>Research focus</h2>
          <div className="pt-4">
            <label htmlFor="research_domain" className={labelClass}>
              Field <span className="text-red-500">*</span>
            </label>
            <select
              id="research_domain"
              className={inputClass}
              defaultValue=""
              {...register("research_domain")}
            >
              <option value="" disabled>
                — Select —
              </option>
              {researchDomainOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.research_domain ? (
              <p className={errorClass}>{errors.research_domain.message}</p>
            ) : null}
          </div>
          <div className="pt-4">
            <label htmlFor="research_subdomain" className={labelClass}>
              Sub-discipline (optional)
            </label>
            <input
              id="research_subdomain"
              type="text"
              placeholder="e.g. machine learning, polymer chemistry, epidemiology"
              className={inputClass}
              {...register("research_subdomain")}
            />
          </div>
          <div className="pt-4">
            <label htmlFor="research_description" className={labelClass}>
              What do you work on? (in your own words){" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              id="research_description"
              rows={5}
              placeholder="Describe your research so someone outside academia can understand it..."
              className={inputClass}
              {...register("research_description")}
            />
            <p className={helpClass}>
              You do not need heavy jargon. State the problem you study and why it matters. ({description.length}/80)
            </p>
            {errors.research_description ? (
              <p className={errorClass}>
                {errors.research_description.message}
              </p>
            ) : null}
          </div>

          {/* SECTION 3: What you can offer industry */}
          <h2 className={sectionHeaderClass}>What you can offer industry</h2>
          <div className="pt-4">
            <span className={labelClass}>
              Practical skills <span className="text-red-500">*</span>
            </span>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
              {skills.map((skill, idx) => (
                <span
                  key={`${skill}-${idx}`}
                  className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 rounded-full px-3 py-1 text-sm"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(idx)}
                    className="ml-1 text-indigo-500 hover:text-indigo-800"
                    aria-label={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              ref={skillInputRef}
              type="text"
              placeholder="Enter a skill and press Enter"
              className={inputClass}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addSkill(e.currentTarget.value);
                }
              }}
              onBlur={(e) => {
                if (e.currentTarget.value.trim()) {
                  addSkill(e.currentTarget.value);
                }
              }}
            />
            <p className={helpClass}>
              Instead of “I study algorithms” → “I optimize statistical processes.”
              Instead of “I do NLP” → “I automate analysis of text
              documents.”
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 mr-1 self-center">
                Suggestions:
              </span>
              {skillSuggestions.map((suggestion) => {
                const already = skills.some(
                  (s) => s.toLowerCase() === suggestion.toLowerCase()
                );
                return (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addSkill(suggestion)}
                    disabled={already}
                    className={`text-xs rounded-full px-2.5 py-1 border transition-colors ${
                      already
                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 bg-white text-gray-700 hover:border-indigo-400 hover:text-indigo-700"
                    }`}
                  >
                    {already ? `✓ ${suggestion}` : `+ ${suggestion}`}
                  </button>
                );
              })}
            </div>
            {errors.practical_skills ? (
              <p className={errorClass}>
                {(errors.practical_skills as { message?: string })?.message ||
                  "Review the skills you entered"}
              </p>
            ) : null}
          </div>


          {/* Wizard navigation */}
          <div className="mt-8 flex items-center justify-between gap-3 pt-6 border-t border-gray-100">
            {wizardStep > 1 ? (
              <button type="button" onClick={() => setWizardStep((s) => Math.max(1, s - 1) as 1|2|3)}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                ← Back
              </button>
            ) : <span />}
            {wizardStep < 3 ? (
              <button type="button" onClick={() => setWizardStep((s) => Math.min(3, s + 1) as 1|2|3)}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
                Next: Projects &amp; Availability →
              </button>
            ) : null}
          </div>
          </>) /* end step 2 */}
          {wizardStep === 3 && (<>
          {/* SECTION 4: Projects and experience */}
          <h2 className={sectionHeaderClass}>Projects and experience</h2>
          <div className="pt-4 space-y-4">
            {projects.fields.map((field, idx) => {
              const projectErrors = errors.projects?.[idx];
              return (
                <div
                  key={field.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      Project {idx + 1}
                    </span>
                    {projects.fields.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => projects.remove(idx)}
                        className="text-xs text-gray-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <div>
                    <label className={labelClass}>
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      {...register(`projects.${idx}.title` as const)}
                    />
                    {projectErrors?.title ? (
                      <p className={errorClass}>
                        {projectErrors.title.message}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label className={labelClass}>Description (optional)</label>
                    <textarea
                      rows={3}
                      placeholder="What you did and what you learned"
                      className={inputClass}
                      {...register(`projects.${idx}.description` as const)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Type</label>
                      <select
                        className={inputClass}
                        defaultValue=""
                        {...register(`projects.${idx}.type` as const)}
                      >
                        <option value="">— Select —</option>
                        {projectTypeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Year from</label>
                      <input
                        type="number"
                        min={1980}
                        max={currentYear + 1}
                        className={inputClass}
                        {...register(`projects.${idx}.year_from` as const, {
                          setValueAs: (v) =>
                            v === "" || v == null ? undefined : Number(v),
                        })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Year to</label>
                      <input
                        type="number"
                        min={1980}
                        max={currentYear + 5}
                        className={inputClass}
                        {...register(`projects.${idx}.year_to` as const, {
                          setValueAs: (v) =>
                            v === "" || v == null ? undefined : Number(v),
                        })}
                      />
                      {projectErrors?.year_to ? (
                        <p className={errorClass}>
                          {projectErrors.year_to.message}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
            {projects.fields.length < 6 ? (
              <button
                type="button"
                onClick={() => projects.append({ ...emptyProject })}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                + Add project
              </button>
            ) : (
              <p className="text-xs text-gray-500">
                Maximum of six projects reached.
              </p>
            )}
            {errors.projects && !Array.isArray(errors.projects) ? (
              <p className={errorClass}>
                {(errors.projects as { message?: string }).message}
              </p>
            ) : null}
          </div>

          {/* SECTION 5: Availability */}
          <h2 className={sectionHeaderClass}>Availability</h2>
          <div className="pt-4">
            <label htmlFor="availability_hours" className={labelClass}>
              How many hours per week can you commit?{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                id="availability_hours"
                type="range"
                min={4}
                max={40}
                step={4}
                className="flex-1 accent-indigo-600"
                {...register("availability_hours_per_week", {
                  valueAsNumber: true,
                })}
              />
              <span className="text-sm font-semibold text-gray-900 min-w-[3rem] text-right">
                {hours} h
              </span>
            </div>
            {errors.availability_hours_per_week ? (
              <p className={errorClass}>
                {errors.availability_hours_per_week.message}
              </p>
            ) : null}
          </div>
          <div className="pt-4">
            <span className={labelClass}>
              Which collaboration formats interest you?{" "}
              <span className="text-red-500">*</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {availabilityModeOptions.map((opt) => {
                const checked = selectedModes.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`flex gap-3 items-start cursor-pointer rounded-lg border p-3 transition-colors ${
                      checked
                        ? "border-indigo-400 bg-indigo-50/40"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={opt.value}
                      checked={checked}
                      onChange={(e) => toggleMode(opt.value, e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-300"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">
                        {opt.title}
                      </span>
                      <span className="block text-xs text-gray-600 mt-0.5">
                        {opt.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {errors.availability_modes ? (
              <p className={errorClass}>
                {(errors.availability_modes as { message?: string })?.message ||
                  "Select at least one format"}
              </p>
            ) : null}
          </div>

          {/* SECTION 6: Motivation */}
          <h2 className={sectionHeaderClass}>Motivation</h2>
          <div className="pt-4">
            <label htmlFor="motivation" className={labelClass}>
              Why do you want to collaborate with industry?{" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              id="motivation"
              rows={5}
              maxLength={600}
              placeholder="Write a few sentences on what motivates you to work with companies, what you want to achieve, and what you offer that is hard to find elsewhere."
              className={inputClass}
              {...register("motivation")}
            />
            <p
              className={`${helpClass} ${
                motivationCount > 600 ? "text-red-600" : ""
              }`}
            >
              {motivationCount} / 600 characters
            </p>
            {errors.motivation ? (
              <p className={errorClass}>{errors.motivation.message}</p>
            ) : null}
          </div>

          {/* SECTION 7: Publications (optional) */}
          <h2 className={sectionHeaderClass}>Publications (optional)</h2>
          <div className="pt-4 space-y-3">
            <p className={helpClass}>
              Optional. We do not score you on publication count — this is context for
              companies.
            </p>
            {publicationLinks.fields.map((field, idx) => (
              <PublicationLinkRow
                key={field.id}
                idx={idx}
                onRemove={() => publicationLinks.remove(idx)}
                register={register}
                error={
                  Array.isArray(errors.publication_links)
                    ? errors.publication_links?.[idx]?.message
                    : undefined
                }
              />
            ))}
            {publicationLinks.fields.length < 10 ? (
              <button
                type="button"
                onClick={() => publicationLinks.append("" as never)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                + Add link
              </button>
            ) : null}
          </div>

          {/* SUBMIT */}
          <div className="pt-8 mt-6 border-t border-gray-100 space-y-3">
            {serverError ? (
              <p
                className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 p-3"
                role="alert"
              >
                {serverError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Saving profile…" : "Register profile"}
            </button>
            <p className="text-xs text-gray-500 text-center">
              After registration you can browse R&D briefs and apply for projects.
            </p>
            <p className="text-xs text-gray-500 text-center">
              <Link href="/" className="text-indigo-600 hover:text-indigo-800">Back to homepage</Link>
            </p>
          </div>
          {/* Step 3 nav */}
          <div className="mt-6 flex items-center gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setWizardStep(2)}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              ← Back
            </button>
          </div>
          </>) /* end step 3 */}
        </form>
        )}
      </div>
    </div>
  );
}

function PublicationLinkRow({
  idx,
  onRemove,
  register,
  error,
}: {
  idx: number;
  onRemove: () => void;
  register: UseFormRegister<FormValues>;
  error?: string;
}) {
  const labelText =
    idx === 0
      ? "[GS] Google Scholar"
      : idx === 1
        ? "[ID] ORCID"
        : "Research profile link";
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">
        {labelText}
      </label>
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="https://scholar.google.com/... or https://doi.org/..."
          className={inputClass}
          {...register(`publication_links.${idx}` as const)}
        />
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-gray-500 hover:text-red-600 px-2"
          aria-label="Remove link"
        >
          Remove
        </button>
      </div>
      {error ? <p className={errorClass}>{error}</p> : null}
    </div>
  );
}
