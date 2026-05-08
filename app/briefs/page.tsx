import { aiBriefResponseSchema } from "@/lib/brief-schema";
import {
  dbListApplicationsForResearcher,
  dbListFavoriteBriefIdsForUser,
  dbListPublishedBriefs,
} from "@/lib/app-db";
import BriefsListingClient, { type BriefListItem } from "./briefs-listing-client";
import { hasSupabasePublicConfig } from "@/lib/server-env";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "R&D Briefs | Nexdoc",
  description: "Published R&D briefs.",
};

export default async function BriefsPage() {
  if (!hasSupabasePublicConfig()) {
    return (
      <BriefsListingClient
        items={[]}
        favoriteBriefIds={[]}
        canFavorite={false}
        appliedStatusByBriefId={{}}
      />
    );
  }

  const data = await dbListPublishedBriefs();
  const user = await getCurrentUser();
  const favoriteBriefIds = user ? await dbListFavoriteBriefIdsForUser(user.id) : [];
  const appliedStatusByBriefId: Record<string, string> = {};

  if (user?.role === "researcher" && user.researcher_id) {
    const applications = await dbListApplicationsForResearcher(user.researcher_id);
    for (const app of applications) {
      if (app.brief_id) {
        appliedStatusByBriefId[app.brief_id] = app.status;
      }
    }
  }

  const items: BriefListItem[] = [];
  for (const row of data ?? []) {
    const raw = (row.raw_input ?? {}) as { industry?: string; timeline?: string; budget?: string };
    const fc = aiBriefResponseSchema.safeParse(row.final_content);
    if (!fc.success) continue;
    items.push({
      id: row.id as string,
      published_at: (row.published_at as string | null) ?? null,
      industry: raw.industry ?? "Inne",
      timeline: raw.timeline ?? "",
      budget: raw.budget ?? "",
      cel_rd: fc.data.cel_rd,
      wymagane_kompetencje: fc.data.wymagane_kompetencje,
    });
  }

  return (
    <BriefsListingClient
      items={items}
      favoriteBriefIds={favoriteBriefIds}
      canFavorite={Boolean(user)}
      appliedStatusByBriefId={appliedStatusByBriefId}
    />
  );
}
