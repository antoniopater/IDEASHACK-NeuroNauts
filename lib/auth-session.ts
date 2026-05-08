import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { dbGetUserById, type AppUserRow, type AppUserRole } from "@/lib/app-db";
import { createSessionToken, getSessionCookieName, getSessionMaxAgeSeconds, verifySessionToken } from "@/lib/auth";

/** Same flags as login cookie so the browser reliably removes the session jar entry. */
function clearedSessionCookieOptions() {
  return {
    path: "/" as const,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  };
}

/** Route handlers must set cookies on the returned `NextResponse` — `cookies()` from `next/headers` may not merge into redirects. */
export function clearSessionCookieOnResponse(res: NextResponse): void {
  res.cookies.set(getSessionCookieName(), "", clearedSessionCookieOptions());
}

/** Route handlers should set session cookie on returned `NextResponse`. */
export function setSessionCookieOnResponse(res: NextResponse, userId: string): void {
  res.cookies.set({
    name: getSessionCookieName(),
    value: createSessionToken(userId),
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: getSessionMaxAgeSeconds(),
  });
}

export async function setAuthSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: getSessionCookieName(),
    value: createSessionToken(userId),
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: getSessionMaxAgeSeconds(),
  });
}

export async function clearAuthSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: getSessionCookieName(),
    value: "",
    ...clearedSessionCookieOptions(),
  });
}

export async function getCurrentUser(): Promise<AppUserRow | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(getSessionCookieName())?.value;
  if (!raw) return null;
  const session = verifySessionToken(raw);
  if (!session) return null;
  return dbGetUserById(session.userId);
}

export async function requireUser(role?: AppUserRole): Promise<AppUserRow> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in");
  if (role && user.role !== role) redirect("/");
  return user;
}
