import { NextResponse } from "next/server";
import { z } from "zod";
import { dbCreateUser } from "@/lib/app-db";
import { hashPassword, isLikelyAcademicEmail } from "@/lib/auth";
import { setAuthSession } from "@/lib/auth-session";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must have at least 8 characters."),
  role: z.enum(["company", "researcher"]),
  institutionName: z.string().trim().max(200).optional().default(""),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON data." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" ");
    return NextResponse.json({ error: msg || "Validation failed." }, { status: 400 });
  }

  const { email, password, role, institutionName } = parsed.data;
  if (role === "researcher" && !isLikelyAcademicEmail(email)) {
    return NextResponse.json(
      {
        error:
          "A university email is required for researcher accounts (institutional affiliation verification).",
      },
      { status: 400 }
    );
  }

  const institutionVerified = role === "researcher" ? isLikelyAcademicEmail(email) : true;
  const created = await dbCreateUser({
    email,
    passwordHash: hashPassword(password),
    role,
    institutionName: role === "researcher" ? institutionName || null : null,
    institutionVerified,
  });
  if ("error" in created) {
    if (created.error.code === "23505") {
      return NextResponse.json({ error: "An account with this email address already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
  }

  await setAuthSession(created.userId);
  return NextResponse.json({ ok: true, role });
}
