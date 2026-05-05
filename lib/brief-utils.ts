/** Pierwsze zdanie lub wiersz z cel_rd — tytuły list i stron. */
export function deriveBriefTitle(celRd: string): string {
  const sentence =
    celRd.match(/^[^.!?]+[.!?]?/)?.[0]?.trim() || celRd.trim().split("\n")[0]?.trim() || "Brief R&D";
  return sentence.length > 140 ? `${sentence.slice(0, 137)}…` : sentence;
}
