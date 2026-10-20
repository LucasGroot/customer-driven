import { describe, expect, it } from "vitest";
import type { RoutineStats } from "../../domain/routines";
import type { AskedQuestion, ReviewDecision, RoutineDocument } from "../../domain/types";
import { matchesQuery, searchDocuments, searchQuestions } from "./searchResults";

function makeQuestion(overrides: Partial<AskedQuestion> = {}): AskedQuestion {
  return {
    id: "q",
    text: "Question",
    reference: "",
    category: "Category",
    documentCode: "KV-001",
    coverage: 0.5,
    needsReview: false,
    ...overrides,
  };
}

const DOCUMENTS: RoutineDocument[] = [
  { code: "KV-001", name: "Ferierutine", revisedLabel: "" },
  { code: "KV-002", name: "Permisjonsreglement", revisedLabel: "" },
  { code: "KV-003", name: "Unused routine", revisedLabel: "" },
];

const QUESTIONS: AskedQuestion[] = [
  makeQuestion({ id: "a", text: "Kan jeg overføre ferie?", coverage: 0.3 }),
  makeQuestion({ id: "b", text: "Permisjon for omsorg", documentCode: "KV-002", coverage: 0.7 }),
  makeQuestion({ id: "c", text: "Ferie i turnus", coverage: 0.2, needsReview: true }),
];

const NO_DECISIONS = (): undefined => undefined;

function makeStats(code: string, coverages: number[]): RoutineStats {
  const document = DOCUMENTS.find((candidate) => candidate.code === code);
  if (document === undefined) throw new Error(`Unknown routine ${code}`);
  return {
    routine: document,
    questions: [],
    questionCount: coverages.length,
    meanCoverage: coverages.reduce((sum, coverage) => sum + coverage, 0) / coverages.length,
  };
}

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

describe("searchQuestions", () => {
  const base = { query: "", filter: "all", sort: "coverage-asc", decisionOf: NO_DECISIONS } as const;

  it("sorts by lowest coverage first", () => {
    expect(ids(searchQuestions(QUESTIONS, DOCUMENTS, base))).toEqual(["c", "a", "b"]);
  });

  it("sorts by highest coverage first", () => {
    const results = searchQuestions(QUESTIONS, DOCUMENTS, { ...base, sort: "coverage-desc" });
    expect(ids(results)).toEqual(["b", "a", "c"]);
  });

  it("says where each question ends up", () => {
    const results = searchQuestions(QUESTIONS, DOCUMENTS, base);
    expect(results.map((result) => [result.question.id, result.placement.kind])).toEqual([
      ["c", "pending"],
      ["a", "routine"],
      ["b", "routine"],
    ]);
  });

  it("follows HR's decisions", () => {
    const decisionOf = (id: string): ReviewDecision | undefined =>
      id === "c" ? { kind: "discarded" } : undefined;
    const results = searchQuestions(QUESTIONS, DOCUMENTS, { ...base, decisionOf });
    expect(results.find((result) => result.question.id === "c")?.placement.kind).toBe("discarded");
  });

  it("filters on where the question ended up", () => {
    expect(ids(searchQuestions(QUESTIONS, DOCUMENTS, { ...base, filter: "pending" }))).toEqual(["c"]);
    expect(ids(searchQuestions(QUESTIONS, DOCUMENTS, { ...base, filter: "routine" }))).toEqual([
      "a",
      "b",
    ]);
  });

  it("finds questions by the name of their best document", () => {
    const results = searchQuestions(QUESTIONS, DOCUMENTS, { ...base, query: "permisjonsregl" });
    expect(ids(results)).toEqual(["b"]);
  });
});

describe("searchDocuments", () => {
  const routines = [makeStats("KV-001", [0.2, 0.3]), makeStats("KV-002", [0.7])];

  it("shows how many questions sit on each routine and their mean coverage", () => {
    const results = searchDocuments(DOCUMENTS, routines, { query: "", sort: "coverage-asc" });
    expect(results.map((result) => [result.document.code, result.questionCount])).toEqual([
      ["KV-001", 2],
      ["KV-002", 1],
      ["KV-003", 0],
    ]);
    expect(results[0]?.meanCoverage).toBeCloseTo(0.25);
  });

  it("puts documents without questions last in both coverage orders", () => {
    const results = searchDocuments(DOCUMENTS, routines, { query: "", sort: "coverage-desc" });
    expect(results.map((result) => result.document.code)).toEqual(["KV-002", "KV-001", "KV-003"]);
  });
});
