import { NextResponse } from "next/server";
import { publishBriefBodySchema } from "@/lib/brief-schema";
import { dbPublishBrief } from "@/lib/app-db";
import {
  hasSupabaseServiceConfig,
  SUPABASE_SERVICE_MISSING_MESSAGE,
} from "@/lib/server-env";

function briefSlugFromUuid(id: string): string {
  return id.replace(/-/g, "").slice(0, 8);
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe ciało żądania JSON." }, { status: 400 });
  }

  const parsed = publishBriefBodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" ");
    return NextResponse.json({ error: msg || "Walidacja nie powiodła się." }, { status: 400 });
  }

  const { companyName, companyEmail, rawInput, finalContent } = parsed.data;

  if (!hasSupabaseServiceConfig()) {
    return NextResponse.json({ error: SUPABASE_SERVICE_MISSING_MESSAGE }, { status: 500 });
  }

  const result = await dbPublishBrief({
    companyName,
    companyEmail,
    rawInput: rawInput as Record<string, unknown>,
    finalContent,
  });

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error || "Nie udało się opublikować briefu." },
      { status: 500 }
    );
  }

  const { briefId, accessToken } = result;
  const origin =
    process.env.NEXT_PUBLIC_APP_ORIGIN?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const applicationsPath = `/company/briefs/${briefId}/applications?token=${accessToken}`;
  const applicationsManageUrl = origin ? `${origin}${applicationsPath}` : applicationsPath;

  return NextResponse.json({
    briefId,
    slug: briefSlugFromUuid(briefId),
    companyAccessToken: accessToken,
    applicationsManageUrl,
  });
}
