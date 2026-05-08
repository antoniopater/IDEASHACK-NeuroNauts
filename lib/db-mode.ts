/** Tryb deweloperski: dane w pliku JSON zamiast Supabase (bez kluczy i migracji). */
export function isLocalJsonDb(): boolean {
  const v = process.env.USE_LOCAL_JSON_DB?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
