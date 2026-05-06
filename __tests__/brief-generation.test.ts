/**
 * Testy bez prawdziwych wywołań Anthropic / Supabase (mocki na poziomie modułów).
 */
import { calculateProfileCompleteness } from "@/lib/profile-completeness";
import { buildMatchUserPrompt, parseMatchResponse } from "@/lib/matching";
import { parseProfileBuilderResponse } from "@/lib/profile-builder";
import { classifyResearcher } from "@/lib/researcher-classification";
import { recommendBriefsForResearcher } from "@/lib/researcher-recommendations";
import {
  generateBriefInputSchema,
  profileBuilderResponseSchema,
  researcherRegistrationSchema,
} from "@/lib/validations";

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

describe("researcherRegistrationSchema", () => {
  it("normalizuje pusty typ projektu do undefined", () => {
    const result = researcherRegistrationSchema.safeParse({
      first_name: "Ala",
      last_name: "Testowa",
      email: "ala@example.org",
      institution: "Politechnika",
      phd_start_year: 2023,
      stage: "doktorant",
      research_domain: "Informatyka i AI",
      research_description: "Opis badań ".repeat(12),
      practical_skills: ["Python", "SQL", "Raportowanie"],
      projects: [{ title: "Projekt", description: "Opis projektu testowego", type: "" }],
      availability_hours_per_week: 8,
      availability_modes: ["consultation"],
      motivation: "Motywacja ".repeat(12),
      publication_links: [""],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.projects[0].type).toBeUndefined();
  });
});

describe("profile builder", () => {
  it("parsuje poprawny JSON profilu", () => {
    const raw = JSON.stringify({
      research_subdomain: "NLP",
      research_description: "Opis badań ".repeat(12),
      practical_skills: ["Python", "Ewaluacja modeli", "Raporty techniczne"],
      projects: [
        {
          title: "Klasyfikacja tekstu",
          description: "Projekt badawczy z ewaluacją modeli tekstowych.",
          type: "research",
        },
      ],
      motivation: "Chcę współpracować z firmami nad praktycznymi projektami AI. ".repeat(2),
      publication_links: ["https://example.org/paper"],
    });
    const parsed = parseProfileBuilderResponse(raw);
    expect(profileBuilderResponseSchema.safeParse(parsed).success).toBe(true);
    expect(parsed.practical_skills).toContain("Python");
  });
});

describe("classifyResearcher", () => {
  it("oznacza profil z projektem industry jako gotowy do firm", () => {
    const classification = classifyResearcher({
      stage: "doktorant",
      research_description: "Opis badań ".repeat(30),
      practical_skills: ["Python", "OR-Tools", "Raporty", "SQL", "Optymalizacja", "POC"],
      publication_links: [],
      projects: [{ title: "POC", description: "Projekt dla firmy", type: "industry" }],
    });
    expect(classification.tier).toBe("industry_ready");
  });
});

describe("recommendBriefsForResearcher", () => {
  it("rankuje brief po overlapie skillów i domeny", () => {
    const recommendations = recommendBriefsForResearcher(
      {
        research_domain: "Informatyka i AI",
        research_subdomain: "optymalizacja tras",
        practical_skills: ["Python", "OR-Tools", "Vehicle routing"],
        availability_hours_per_week: 16,
        availability_modes: ["proof_of_concept"],
      },
      [
        {
          id: "brief-1",
          published_at: null,
          raw_input: { industry: "IT i oprogramowanie", timeline: "1–3 miesiące" },
          final_content: {
            cel_rd: "Optymalizacja tras serwisantów",
            wymagane_kompetencje: ["Python", "Vehicle routing"],
            zakres_projektu: "Implementacja prototypu w Pythonie",
            oczekiwany_rezultat: "POC",
            pierwszy_milestone: "Model problemu",
            suggested_researcher_profile: "Osoba znająca OR-Tools",
          },
        },
      ]
    );
    expect(recommendations[0].score).toBeGreaterThanOrEqual(70);
  });
});

describe("parseMatchResponse", () => {
  it("obsługuje wymiarowy breakdown dopasowania", () => {
    const parsed = parseMatchResponse(
      JSON.stringify({
        score: 88,
        explanation: "Dobre dopasowanie.",
        strengths: ["skill"],
        risks: ["zakres"],
        dimensions: {
          domain_fit: { score: 90, rationale: "Domena pasuje." },
          skills_fit: { score: 85, rationale: "Skill pasuje." },
          availability_fit: { score: 80, rationale: "Czas pasuje." },
          motivation_fit: { score: 92, rationale: "Motywacja pasuje." },
        },
      })
    );
    expect(parsed.dimensions?.skills_fit.score).toBe(85);
  });
});
