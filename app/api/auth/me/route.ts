import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      institutionVerified: user.institution_verified,
      companyId: user.company_id,
      researcherId: user.researcher_id,
    },
  });
}
