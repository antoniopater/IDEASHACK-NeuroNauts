/**
 * Testy bez prawdziwych wywołań Anthropic / Supabase (mocki na poziomie modułów).
 */
import { calculateProfileCompleteness } from "@/lib/profile-completeness";
import { buildMatchUserPrompt } from "@/lib/matching";
import { generateBriefInputSchema } from "@/lib/validations";

jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockRejectedValue(new Error("mock: Anthropic nie powinno być wołane w tym teście")),
    },
  })),
}));

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}));

describe("generateBriefInputSchema", () => {
  it("odrzuca problem krótszy niż 50 znaków", () => {
    const result = generateBriefInputSchema.safeParse({
      problem: "za krótko",
      industry: "IT i oprogramowanie",
      timeline: "1–3 miesiące",
      budget: "Do 5 000 zł",
    });
    expect(result.success).toBe(false);
  });
});

describe("calculateProfileCompleteness", () => {
  it("zwraca 0 dla pustego profilu", () => {
    const { score, missing } = calculateProfileCompleteness({});
    expect(score).toBe(0);
    expect(missing.length).toBeGreaterThan(0);
  });

  it("daje maksymalny wynik dla kompletnego profilu", () => {
    const { score } = calculateProfileCompleteness({
      first_name: "Jan",
      last_name: "Test",
      institution: "Politechnika Warszawska",
      phd_start_year: 2020,
      stage: "doktorant",
      research_description: "x".repeat(160),
      practical_skills: ["a", "b", "c", "d", "e", "f"],
      projects: [{ title: "Projekt", description: "y".repeat(25) }],
      motivation: "z".repeat(200),
      availability_hours_per_week: 8,
      availability_modes: ["consultation"],
      publication_links: ["https://example.org/artykul"],
    });
    expect(score).toBe(100);
  });
});

describe("buildMatchUserPrompt", () => {
  it("wypełnia wszystkie pola szablonu (brak „undefined” w tekście)", () => {
    const prompt = buildMatchUserPrompt({
      industry: "IT i oprogramowanie",
      cel_rd: "Cel testowy.",
      wymagane_kompetencje: "ML, SQL",
      zakres_projektu: "Zakres.",
      timeline: "1–3 miesiące",
      stage: "doktorant",
      research_domain: "Informatyka i AI",
      research_subdomain: "NLP",
      research_description: "Opis.",
      practical_skills: "Python",
      projects_summary: "Projekty.",
      availability_hours: "8",
      availability_modes: "zdalnie",
      motivation: "Motywacja.",
    });
    expect(prompt).not.toMatch(/undefined/i);
    expect(prompt).toContain("IT i oprogramowanie");
    expect(prompt).toContain("Motywacja.");
  });
});
