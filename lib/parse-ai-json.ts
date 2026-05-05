/**
 * Extracts a JSON object from model output that may include markdown fences or prose.
 */
export function parseJsonObjectFromText(raw: string): unknown {
  let text = raw.trim();
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)```$/im);
  if (fence?.[1]) {
    text = fence[1].trim();
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Brak poprawnego obiektu JSON w odpowiedzi modelu.");
  }
  return JSON.parse(text.slice(start, end + 1));
}
