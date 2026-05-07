import { NextResponse } from "next/server";
import { z } from "zod";
import { localGetAllResearchers } from "@/lib/local-json-db";

const bodySchema = z.object({
  problem: z.string().min(1),
  domain: z.string().optional().default(""),
});

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9ąćęłńóśźż\s]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const w of a) if (b.has(w)) count++;
  return count;
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Bad input" }, { status: 400 });

  const { problem, domain } = parsed.data;
  const problemTokens = tokenize(problem);

  let researchers: Awaited<ReturnType<typeof localGetAllResearchers>> = [];
  try {
    researchers = await localGetAllResearchers();
  } catch {
    researchers = [];
  }

  const scored = researchers.map((r) => {
    const hay = [
      r.research_description ?? "",
      (r.practical_skills ?? []).join(" "),
      r.research_domain ?? "",
      r.research_subdomain ?? "",
    ].join(" ");
    const hayTokens = tokenize(hay);
    const kwOverlap = overlap(problemTokens, hayTokens);
    const domainBonus =
      domain && r.research_domain?.toLowerCase().includes(domain.toLowerCase()) ? 15 : 0;
    const base = Math.min(80, kwOverlap * 8 + domainBonus);
    const completenessBonus = Math.round((r.profile_completeness ?? 0) * 0.1);
    const score = Math.min(95, Math.max(10, base + completenessBonus));
    return {
      id: r.id,
      first_name: r.first_name,
      last_name: r.last_name,
      institution: r.institution,
      stage: r.stage,
      research_domain: r.research_domain,
      research_description: r.research_description
        ? r.research_description.slice(0, 100)
        : null,
      practical_skills: (r.practical_skills ?? []).slice(0, 3),
      availability_hours_per_week: r.availability_hours_per_week,
      score,
    };
  });

  const top3 = scored.sort((a, b) => b.score - a.score).slice(0, 3);
  return NextResponse.json({ researchers: top3 });
}
