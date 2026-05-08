/** Timeline values saved from the company brief form */
export const TIMELINE_VALUES = [
  "1-4 weeks",
  "1-3 months",
  "3-6 months",
  "6-12 months",
] as const;

export type TimelineFilterId = "all" | "lt1m" | "1to3m" | "gt3m";

const TIMELINE_BUCKETS: Record<Exclude<TimelineFilterId, "all">, readonly string[]> = {
  lt1m: ["1-4 weeks"],
  "1to3m": ["1-3 months"],
  gt3m: ["3-6 months", "6-12 months"],
};

export function timelineMatchesFilter(timeline: string, filter: TimelineFilterId): boolean {
  if (filter === "all") return true;
  const bucket = TIMELINE_BUCKETS[filter];
  return bucket.includes(timeline);
}

export type BudgetFilterId = "all" | "lte20k" | "gt20k";

const BUDGET_LTE20K = new Set(["Under PLN 5,000", "PLN 5,000-20,000"]);
const BUDGET_GT20K = new Set(["PLN 20,000-50,000", "Over PLN 50,000"]);

export function budgetMatchesFilter(budget: string, filter: BudgetFilterId): boolean {
  if (filter === "all") return true;
  if (budget === "Open to discuss") return false;
  if (filter === "lte20k") return BUDGET_LTE20K.has(budget);
  return BUDGET_GT20K.has(budget);
}

export function industriesMatch(selected: string[], industry: string): boolean {
  if (selected.length === 0) return true;
  return selected.includes(industry);
}
