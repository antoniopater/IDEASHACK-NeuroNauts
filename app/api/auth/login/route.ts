import { NextResponse } from "next/server";
import { z } from "zod";
import { dbGetUserByEmail } from "@/lib/app-db";
import { verifyPassword } from "@/lib/auth";
import { setSessionCookieOnResponse } from "@/lib/auth-session";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
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
    return NextResponse.json({ error: "Invalid login data." }, { status: 400 });
  }
  const user = await dbGetUserByEmail(parsed.data.email);
  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, role: user.role, researcher_id: user.researcher_id ?? null });
  setSessionCookieOnResponse(res, user.id);
  return res;
}
