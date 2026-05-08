/**
 * Tests without real Anthropic / Supabase calls (module-level mocks).
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
      create: jest.fn().mockRejectedValue(new Error("mock: Anthropic should not be called in this test")),
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
  it("rejects a problem shorter than 50 characters", () => {
    const result = generateBriefInputSchema.safeParse({
      problem: "too short",
      industry: "IT & Software",
      timeline: "1-3 months",
      budget: "Under PLN 5,000",
    });
    expect(result.success).toBe(false);
  });
});

describe("calculateProfileCompleteness", () => {
  it("returns 0 for an empty profile", () => {
    const { score, missing } = calculateProfileCompleteness({});
    expect(score).toBe(0);
    expect(missing.length).toBeGreaterThan(0);
  });

  it("returns maximum score for a complete profile", () => {
    const { score } = calculateProfileCompleteness({
      first_name: "Jan",
      last_name: "Test",
      institution: "Warsaw University of Technology",
      phd_start_year: 2020,
      stage: "doktorant",
      research_description: "x".repeat(160),
      practical_skills: ["a", "b", "c", "d", "e", "f"],
      projects: [{ title: "Project", description: "y".repeat(25) }],
      motivation: "z".repeat(200),
      availability_hours_per_week: 8,
      availability_modes: ["consultation"],
      publication_links: ["https://example.org/article"],
    });
    expect(score).toBe(100);
  });
});

describe("buildMatchUserPrompt", () => {
  it("fills all template fields (no 'undefined' in text)", () => {
    const prompt = buildMatchUserPrompt({
      industry: "IT & Software",
      cel_rd: "Test objective.",
      wymagane_kompetencje: "ML, SQL",
      zakres_projektu: "Scope.",
      timeline: "1-3 months",
      stage: "doktorant",
      research_domain: "Computer Science & AI",
      research_subdomain: "NLP",
      research_description: "Description.",
      practical_skills: "Python",
      projects_summary: "Projects.",
      availability_hours: "8",
      availability_modes: "remote",
      motivation: "Motivation.",
    });
    expect(prompt).not.toMatch(/undefined/i);
    expect(prompt).toContain("IT & Software");
    expect(prompt).toContain("Motivation.");
  });
});

describe("researcherRegistrationSchema", () => {
  it("normalizes an empty project type to undefined", () => {
    const result = researcherRegistrationSchema.safeParse({
      first_name: "Alice",
      last_name: "Tester",
      email: "alice@pw.edu.pl",
      institution: "Warsaw University of Technology",
      phd_start_year: 2023,
      stage: "doktorant",
      research_domain: "Computer Science & AI",
      research_description: "Research description ".repeat(12),
      practical_skills: ["Python", "SQL", "Reporting"],
      projects: [{ title: "Project", description: "Test project description", type: "" }],
      availability_hours_per_week: 8,
      availability_modes: ["consultation"],
      motivation: "Motivation ".repeat(12),
      publication_links: [],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.projects[0].type).toBeUndefined();
  });
});

describe("profile builder", () => {
  it("parses valid profile JSON", () => {
    const raw = JSON.stringify({
      research_subdomain: "NLP",
      research_description: "Research description ".repeat(12),
      practical_skills: ["Python", "Model evaluation", "Technical reports"],
      projects: [
        {
          title: "Text classification",
          description: "Research project on evaluating text models.",
          type: "research",
        },
      ],
      motivation: "I want to collaborate with companies on practical AI projects. ".repeat(2),
      publication_links: ["https://example.org/paper"],
    });
    const parsed = parseProfileBuilderResponse(raw);
    expect(profileBuilderResponseSchema.safeParse(parsed).success).toBe(true);
    expect(parsed.practical_skills).toContain("Python");
  });
});

describe("classifyResearcher", () => {
  it("marks a profile with an industry project as company-ready", () => {
    const classification = classifyResearcher({
      stage: "doktorant",
      research_description: "Research description ".repeat(30),
      practical_skills: ["Python", "OR-Tools", "Reports", "SQL", "Optimization", "POC"],
      publication_links: [],
      projects: [{ title: "POC", description: "Project for a company", type: "industry" }],
    });
    expect(classification.tier).toBe("industry_ready");
  });
});

describe("recommendBriefsForResearcher", () => {
  it("ranks a brief by skill and domain overlap", () => {
    const recommendations = recommendBriefsForResearcher(
      {
        research_domain: "Computer Science & AI",
        research_subdomain: "route optimization",
        practical_skills: ["Python", "OR-Tools", "Vehicle routing"],
        availability_hours_per_week: 16,
        availability_modes: ["proof_of_concept"],
      },
      [
        {
          id: "brief-1",
          published_at: null,
          raw_input: { industry: "IT & Software", timeline: "1-3 months" },
          final_content: {
            cel_rd: "Service technician route optimization",
            wymagane_kompetencje: ["Python", "Vehicle routing"],
            zakres_projektu: "Prototype implementation in Python",
            oczekiwany_rezultat: "POC",
            pierwszy_milestone: "Problem model",
            suggested_researcher_profile: "Someone familiar with OR-Tools",
          },
        },
      ]
    );
    expect(recommendations[0].score).toBeGreaterThanOrEqual(70);
  });
});

describe("parseMatchResponse", () => {
  it("handles dimensional match breakdown", () => {
    const parsed = parseMatchResponse(
      JSON.stringify({
        score: 88,
        explanation: "Good fit.",
        strengths: ["skill"],
        risks: ["scope"],
        dimensions: {
          domain_fit: { score: 90, rationale: "Domain matches." },
          skills_fit: { score: 85, rationale: "Skills match." },
          availability_fit: { score: 80, rationale: "Time fits." },
          motivation_fit: { score: 92, rationale: "Motivation matches." },
        },
      })
    );
    expect(parsed.dimensions?.skills_fit.score).toBe(85);
  });
});
