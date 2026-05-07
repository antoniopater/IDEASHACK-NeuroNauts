import { NextResponse } from "next/server";
import { clearSessionCookieOnResponse } from "@/lib/auth-session";

/** Nav uses `<Link href="...">` → GET. Set-Cookie must be on this `NextResponse` (not only `cookies()`). */
export async function GET(request: Request) {
  const res = NextResponse.redirect(new URL("/", request.url));
  clearSessionCookieOnResponse(res);
  return res;
}

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearSessionCookieOnResponse(res);
  return res;
}
