import { calculateProfileCompleteness } from "@/lib/profile-completeness";
import { dbRegisterResearcher } from "@/lib/app-db";
import {
  hasSupabaseServiceConfig,
  SUPABASE_SERVICE_MISSING_MESSAGE,
} from "@/lib/server-env";
import { researcherRegistrationSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import { dbLinkUserResearcher } from "@/lib/app-db";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Musisz byc zalogowany jako badacz." }, { status: 401 });
  }
  if (user.role !== "researcher") {
    return NextResponse.json({ error: "To konto nie ma uprawnien badacza." }, { status: 403 });
  }
  if (!user.institution_verified) {
    return NextResponse.json(
      { error: "Konto badacza wymaga potwierdzenia afiliacji uczelnianej." },
      { status: 403 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Nieprawidłowe ciało żądania JSON." },
      { status: 400 }
    );
  }

  const parsed = researcherRegistrationSchema.safeParse(json);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".") || "_root";
      (fieldErrors[path] ??= []).push(issue.message);
    }
    return NextResponse.json(
      { error: "Walidacja nie powiodła się.", fieldErrors },
      { status: 400 }
    );
  }

  if (!hasSupabaseServiceConfig()) {
    return NextResponse.json({ error: SUPABASE_SERVICE_MISSING_MESSAGE }, { status: 500 });
  }

  const data = parsed.data;
  if (data.email.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
    return NextResponse.json(
      { error: "E-mail w formularzu musi byc zgodny z e-mailem konta." },
      { status: 400 }
    );
  }
  const completeness = calculateProfileCompleteness({
    first_name: data.first_name,
    last_name: data.last_name,
    institution: data.institution,
    phd_start_year: data.phd_start_year,
    stage: data.stage,
    research_description: data.research_description,
    practical_skills: data.practical_skills,
    projects: data.projects,
    motivation: data.motivation,
    availability_hours_per_week: data.availability_hours_per_week,
    availability_modes: data.availability_modes,
    publication_links: data.publication_links,
  });

  const result = await dbRegisterResearcher(data, completeness.score);

  if ("error" in result) {
    if (result.error.code === "23505") {
      return NextResponse.json(
        { error: "Profil z tym adresem email już istnieje." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: result.error.message || "Nie udało się zapisać profilu badacza." },
      { status: 500 }
    );
  }

  await dbLinkUserResearcher(user.id, result.researcherId);

  return NextResponse.json({
    researcherId: result.researcherId,
    profileCompleteness: completeness.score,
    missingFields: completeness.missing,
  });
}
