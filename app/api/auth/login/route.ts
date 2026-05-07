import { NextResponse } from "next/server";
import { z } from "zod";
import { dbGetUserByEmail } from "@/lib/app-db";
import { verifyPassword } from "@/lib/auth";
import { setAuthSession } from "@/lib/auth-session";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
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
    return NextResponse.json({ error: "Nieprawidlowe dane logowania." }, { status: 400 });
  }
  const user = await dbGetUserByEmail(parsed.data.email);
  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    return NextResponse.json({ error: "Nieprawidlowy e-mail lub haslo." }, { status: 401 });
  }
  await setAuthSession(user.id);
  return NextResponse.json({ ok: true, role: user.role, researcher_id: user.researcher_id ?? null });
}
