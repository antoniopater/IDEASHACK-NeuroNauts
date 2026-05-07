import {
  dbFindApplication,
  dbGetBriefForCompany,
  dbUpdateApplicationStatus,
  dbVerifyBriefToken,
} from "@/lib/app-db";
import {
  hasSupabaseServiceConfig,
  SUPABASE_SERVICE_MISSING_MESSAGE,
} from "@/lib/server-env";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-session";

const bodySchema = z.object({
  applicationId: z.string().uuid(),
  briefId: z.string().uuid(),
  token: z.string().min(16).optional(),
  status: z.enum(["pending", "shortlisted", "rejected"]),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe ciało żądania JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" ");
    return NextResponse.json({ error: msg || "Walidacja nie powiodła się." }, { status: 400 });
  }

  const { applicationId, briefId, token, status } = parsed.data;

  if (!hasSupabaseServiceConfig()) {
    return NextResponse.json({ error: SUPABASE_SERVICE_MISSING_MESSAGE }, { status: 500 });
  }

  let authorized = false;
  if (token) {
    authorized = await dbVerifyBriefToken(briefId, token);
  }
  if (!authorized) {
    const user = await getCurrentUser();
    if (user?.role === "company" && user.company_id) {
      const brief = await dbGetBriefForCompany(briefId);
      authorized = Boolean(brief?.company_id && brief.company_id === user.company_id);
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Brak uprawnień lub nieprawidłowy link." }, { status: 403 });
  }

  const appRow = await dbFindApplication(applicationId, briefId);
  if (!appRow) {
    return NextResponse.json({ error: "Nie znaleziono aplikacji." }, { status: 404 });
  }

  try {
    await dbUpdateApplicationStatus(applicationId, status);
  } catch {
    return NextResponse.json({ error: "Nie udało się zaktualizować statusu." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
