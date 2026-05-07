import { NextResponse } from "next/server";
import { z } from "zod";
import { dbCreateUser } from "@/lib/app-db";
import { hashPassword, isLikelyAcademicEmail } from "@/lib/auth";
import { setAuthSession } from "@/lib/auth-session";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Haslo musi miec co najmniej 8 znakow."),
  role: z.enum(["company", "researcher"]),
  institutionName: z.string().trim().max(200).optional().default(""),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidlowe dane JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" ");
    return NextResponse.json({ error: msg || "Walidacja nie powiodla sie." }, { status: 400 });
  }

  const { email, password, role, institutionName } = parsed.data;
  if (role === "researcher" && !isLikelyAcademicEmail(email)) {
    return NextResponse.json(
      {
        error:
          "Dla konta badacza wymagany jest e-mail uczelniany (potwierdzenie afiliacji instytucjonalnej).",
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
      return NextResponse.json({ error: "Konto z tym adresem e-mail juz istnieje." }, { status: 409 });
    }
    return NextResponse.json({ error: "Nie udalo sie zalozyc konta." }, { status: 500 });
  }

  await setAuthSession(created.userId);
  return NextResponse.json({ ok: true, role });
}
