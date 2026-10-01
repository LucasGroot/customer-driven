import { describe, expect, it } from "vitest";
import type { AskedQuestion, KnowledgeGap, RoutineDocument } from "../../domain/types";
import { listedGapIds, matchesQuery, searchDocuments, searchQuestions } from "./searchResults";

function makeQuestion(overrides: Partial<AskedQuestion> = {}): AskedQuestion {
  return {
    id: "q",
    text: "Question",
    reference: "",
    topic: "Topic",
    documentCode: "KV-001",
    coverage: 0.5,
    ...overrides,
  };
}

const DOCUMENTS: RoutineDocument[] = [
  { code: "KV-001", name: "Ferierutine", revisedLabel: "" },
  { code: "KV-002", name: "Permisjonsreglement", revisedLabel: "" },
  { code: "KV-003", name: "Unused routine", revisedLabel: "" },
];

const QUESTIONS: AskedQuestion[] = [
  makeQuestion({ id: "a", text: "Kan jeg overføre ferie?", gapId: "g1", coverage: 0.3 }),
  makeQuestion({ id: "b", text: "Permisjon for omsorg", documentCode: "KV-002", coverage: 0.7 }),
  makeQuestion({ id: "c", text: "Ferie i turnus", gapId: "g2", coverage: 0.2 }),
];

const ALL_LISTED = new Set(["g1", "g2"]);

function ids(results: { question: AskedQuestion }[]): string[] {
  return results.map((result) => result.question.id);
}

describe("matchesQuery", () => {
  it("matches everything when the query is blank", () => {
    expect(matchesQuery(["anything"], "  ")).toBe(true);
  });

  it("ignores case, including Norwegian letters", () => {
    expect(matchesQuery(["Pårørende"], "PÅRØR")).toBe(true);
  });

  it("matches on any field", () => {
    expect(matchesQuery(["one", "two"], "two")).toBe(true);
    expect(matchesQuery(["one", "two"], "three")).toBe(false);
  });
});

describe("listedGapIds", () => {
  it("leaves out gaps covered above the cut-off", () => {
    const gaps = [{ id: "low", coverage: 0.4 }, { id: "high", coverage: 0.8 }] as KnowledgeGap[];
    expect([...listedGapIds(gaps, 70)]).toEqual(["low"]);
  });
});

describe("searchQuestions", () => {
  const base = { query: "", visibility: "all", sort: "coverage-asc", listed: ALL_LISTED } as const;

  it("sorts by lowest coverage first", () => {
    expect(ids(searchQuestions(QUESTIONS, DOCUMENTS, base))).toEqual(["c", "a", "b"]);
  });

  it("sorts by highest coverage first", () => {
    const results = searchQuestions(QUESTIONS, DOCUMENTS, { ...base, sort: "coverage-desc" });
    expect(ids(results)).toEqual(["b", "a", "c"]);
  });

  it("marks a question as listed only when its gap is in the list", () => {
    const results = searchQuestions(QUESTIONS, DOCUMENTS, { ...base, listed: new Set(["g1"]) });
    expect(results.map((result) => [result.question.id, result.listed])).toEqual([
      ["c", false],
      ["a", true],
      ["b", false],
    ]);
  });

  it("filters on list visibility", () => {
    expect(ids(searchQuestions(QUESTIONS, DOCUMENTS, { ...base, visibility: "listed" }))).toEqual([
      "c",
      "a",
    ]);
    expect(ids(searchQuestions(QUESTIONS, DOCUMENTS, { ...base, visibility: "hidden" }))).toEqual([
      "b",
    ]);
  });

  it("finds questions by the name of their best document", () => {
    const results = searchQuestions(QUESTIONS, DOCUMENTS, { ...base, query: "permisjonsregl" });
    expect(ids(results)).toEqual(["b"]);
  });
});

describe("searchDocuments", () => {
  it("averages coverage over the questions each document matched best", () => {
    const results = searchDocuments(DOCUMENTS, QUESTIONS, { query: "", sort: "coverage-asc" });
    expect(results.map((result) => [result.document.code, result.questionCount])).toEqual([
      ["KV-001", 2],
      ["KV-002", 1],
      ["KV-003", 0],
    ]);
    expect(results[0]?.meanCoverage).toBeCloseTo(0.25);
  });

  it("puts documents without matches last in both coverage orders", () => {
    const results = searchDocuments(DOCUMENTS, QUESTIONS, { query: "", sort: "coverage-desc" });
    expect(results.map((result) => result.document.code)).toEqual(["KV-002", "KV-001", "KV-003"]);
  });
});
