import { NextResponse } from "next/server";
import { clearAuthSession } from "@/lib/auth-session";

export async function POST(req: Request) {
  await clearAuthSession();
  return NextResponse.redirect(new URL("/", req.url));
}

export async function GET(req: Request) {
  await clearAuthSession();
  return NextResponse.redirect(new URL("/", req.url));
}
