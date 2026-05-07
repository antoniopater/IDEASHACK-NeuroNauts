import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { dbGetUserById, type AppUserRow, type AppUserRole } from "@/lib/app-db";
import { createSessionToken, getSessionCookieName, getSessionMaxAgeSeconds, verifySessionToken } from "@/lib/auth";

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
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
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
