import { NextResponse } from "next/server";
import { z } from "zod";
import { dbSetFavoriteBrief } from "@/lib/app-db";
import { requireUser } from "@/lib/auth-session";

const bodySchema = z.object({
  briefId: z.string().uuid(),
  favorite: z.boolean(),
});

export async function POST(req: Request) {
  const user = await requireUser();
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON data." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid favorite payload." }, { status: 400 });
  }
  await dbSetFavoriteBrief(user.id, parsed.data.briefId, parsed.data.favorite);
  return NextResponse.json({ ok: true });
}
