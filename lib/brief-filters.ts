/** Timeline values saved from the company brief form */
export const TIMELINE_VALUES = [
  "1–4 tygodnie",
  "1–3 miesiące",
  "3–6 miesięcy",
  "6–12 miesięcy",
] as const;

export type TimelineFilterId = "all" | "lt1m" | "1to3m" | "gt3m";

const TIMELINE_BUCKETS: Record<Exclude<TimelineFilterId, "all">, readonly string[]> = {
  lt1m: ["1–4 tygodnie"],
  "1to3m": ["1–3 miesiące"],
  gt3m: ["3–6 miesięcy", "6–12 miesięcy"],
};

export function timelineMatchesFilter(timeline: string, filter: TimelineFilterId): boolean {
  if (filter === "all") return true;
  const bucket = TIMELINE_BUCKETS[filter];
  return bucket.includes(timeline);
}

export type BudgetFilterId = "all" | "lte20k" | "gt20k";

const BUDGET_LTE20K = new Set(["Do 5 000 zł", "5 000–20 000 zł"]);
const BUDGET_GT20K = new Set(["20 000–50 000 zł", "Powyżej 50 000 zł"]);

export function budgetMatchesFilter(budget: string, filter: BudgetFilterId): boolean {
  if (filter === "all") return true;
  if (budget === "Do ustalenia") return false;
  if (filter === "lte20k") return BUDGET_LTE20K.has(budget);
  return BUDGET_GT20K.has(budget);
}

export function industriesMatch(selected: string[], industry: string): boolean {
  if (selected.length === 0) return true;
  return selected.includes(industry);
}
