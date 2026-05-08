import { aiBriefResponseSchema, deriveBriefTitle } from "@/lib/brief-schema";
import { dbListPublishedBriefsHomeLimit } from "@/lib/app-db";
import { industryBadgeClass } from "@/lib/industry-styles";
import { hasSupabasePublicConfig } from "@/lib/server-env";
import { ConnectionGraph } from "@/components/shared/connection-graph";
import Link from "next/link";

type Raw = { industry?: string; timeline?: string; budget?: string };

function truncate(s: string, n: number) {
  const t = s.trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1)}…`;
}

const PARTNERS = [
  { name: "QuantumLeap Robotics", industry: "Robotics & Automation", location: "Wroclaw", abbr: "QL" },
  { name: "BioNova Research", industry: "Pharmaceuticals & Biotech", location: "Krakow", abbr: "BN" },
  { name: "GreenAxis Energy", industry: "Clean Energy", location: "Gdansk", abbr: "GA" },
  { name: "MedVision Labs", industry: "MedTech & AI", location: "Poznan", abbr: "MV" },
  { name: "DataCore Systems", industry: "Data & AI", location: "Warsaw", abbr: "DC" },
  { name: "SmartFactory Poland", industry: "Industry 4.0", location: "Lodz", abbr: "SF" },
];

const TESTIMONIALS = [
  {
    quote: "Within two weeks we had a PhD student from AGH who understood our problem more deeply than any external consulting firm. Proof of concept delivered in 6 weeks.",
    name: "Monika Trzeciak",
    role: "Head of R&D, QuantumLeap Robotics",
    initials: "MT",
    color: "from-indigo-500 to-violet-600",
  },
  {
    quote: "Nexdoc is the only place where my doctoral work - combinatorial optimization - actually translates into commercial projects. I've earned more than from a research grant.",
    name: "Dr Jakub Piotrowski",
    role: "PhD Student, Wroclaw University of Technology",
    initials: "JP",
    color: "from-emerald-500 to-cyan-600",
  },
  {
    quote: "We were looking for someone with biomaterials expertise. Nexdoc matched a profile in 48h. Collaboration has been going for six months and we are already planning to expand the scope.",
    name: "Sarah Kowalski",
    role: "CTO, BioNova Research",
    initials: "SK",
    color: "from-pink-500 to-rose-600",
  },
];

export default async function Home() {
  let briefRows: { id: unknown; raw_input: unknown; final_content: unknown }[] | null = null;
  if (hasSupabasePublicConfig()) {
    briefRows = await dbListPublishedBriefsHomeLimit(3);
  }

  const previews: { id: string; industry: string; title: string; snippet: string }[] = [];
  for (const row of briefRows ?? []) {
    const raw = (row.raw_input ?? {}) as Raw;
    const fc = aiBriefResponseSchema.safeParse(row.final_content);
    if (!fc.success) continue;
    previews.push({
      id: row.id as string,
      industry: raw.industry ?? "Other",
      title: deriveBriefTitle(fc.data.cel_rd),
      snippet: truncate(fc.data.cel_rd, 140),
    });
  }

  return (
    <div className="font-[family-name:var(--font-geist-sans)] bg-white">

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
          <svg className="absolute inset-0 h-full w-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Next-gen R&D platform
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            PhD researchers meet{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              business
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
            Nexdoc connects companies seeking R&D support with top PhD researchers. AI matches profiles, briefs are created in minutes, collaboration starts in days.
          </p>
          <div className="mt-10 inline-flex w-full max-w-xl flex-col rounded-2xl border border-white/15 bg-white/5 p-2 backdrop-blur sm:flex-row">
            <Link
              href="/researcher/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-colors hover:bg-indigo-500 sm:flex-1"
            >
              I&apos;m a researcher
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <Link
              href="/company/new-brief"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:ml-2 sm:flex-1"
            >
              I&apos;m looking for expertise
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-gray-100 bg-white px-4 py-12">
        <div className="mx-auto max-w-5xl grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { value: "500+", label: "registered researchers" },
            { value: "120+", label: "partner companies" },
            { value: "PLN 3.2M", label: "in completed projects" },
            { value: "94%", label: "collaboration satisfaction" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl sm:text-4xl font-bold text-indigo-600">{s.value}</p>
              <p className="mt-1 text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gray-50 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How does it work?</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">From problem to collaboration in three simple steps</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Describe your problem",
                desc: "A company describes its R&D challenge in plain words. Nexdoc AI transforms it into a full brief with scope, milestones and a researcher profile.",
                icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
              },
              {
                step: "02",
                title: "AI matches",
                desc: "Nexdoc engine analyses each researcher profile — skills, domain, availability, track record — and ranks matches with explanations.",
                icon: "M13 10V3L4 14h7v7l9-11h-7z",
              },
              {
                step: "03",
                title: "Start collaboration",
                desc: "The researcher applies with a cover letter, the company sees the match score and decides. No middlemen, no months of recruitment.",
                icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
              },
            ].map((item) => (
              <div key={item.step} className="relative rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
                <div className="absolute -top-4 left-7 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                  {item.step}
                </div>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNER COMPANIES */}
      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-2">Trusted by</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Companies already using Nexdoc</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PARTNERS.map((p) => (
              <div key={p.name} className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                  {p.abbr}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.industry} · {p.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONNECTION GRAPH */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Competency network</h2>
            <p className="mt-3 text-slate-400 max-w-xl mx-auto">
              Nexdoc builds a connection graph between researcher competencies and company needs — finding matches invisible to the naked eye.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6">
            <ConnectionGraph />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-2">Testimonials</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What users are saying</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-gray-200 bg-gray-50 p-7 flex flex-col">
                <svg className="w-6 h-6 text-indigo-400 mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-sm text-gray-700 leading-relaxed flex-1 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className={`h-9 w-9 shrink-0 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LATEST BRIEFS */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-1">Live briefs</p>
              <h2 className="text-xl font-bold text-gray-900">Latest R&D briefs</h2>
            </div>
            <Link href="/briefs" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap">
              View all →
            </Link>
          </div>
          {previews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
              <p className="text-sm">No published briefs yet - sign in to see the demo.</p>
              <Link href="/auth/sign-in" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800">
                Sign in →
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {previews.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/briefs/${b.id}`}
                    className="block h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-indigo-200 hover:shadow transition-all"
                  >
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${industryBadgeClass(b.industry)}`}>
                      {b.industry}
                    </span>
                    <h3 className="mt-2.5 text-sm font-semibold text-gray-900 line-clamp-2">{b.title}</h3>
                    <p className="mt-1 text-xs text-gray-600 line-clamp-3">{b.snippet}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-gradient-to-r from-indigo-600 to-violet-700 px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to get started?</h2>
          <p className="mt-4 text-indigo-200 max-w-xl mx-auto">
            Join hundreds of researchers and dozens of companies already running R&D projects through Nexdoc.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/researcher/register"
              className="w-full sm:w-auto rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
              Register researcher profile
            </Link>
            <Link
              href="/company/new-brief"
              className="w-full sm:w-auto rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              Create R&D brief
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white px-4 py-8">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-semibold text-gray-900">
            <span className="text-indigo-600">N</span>exdoc
          </p>
          <p className="text-xs text-gray-400">© 2026 Nexdoc. R&D platform for science and business.</p>
          <div className="flex gap-4 text-xs text-gray-500">
            <Link href="/auth/sign-in" className="hover:text-indigo-600">Sign in</Link>
            <Link href="/briefs" className="hover:text-indigo-600">R&D Briefs</Link>
            <Link href="/researchers" className="hover:text-indigo-600">Researchers</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
