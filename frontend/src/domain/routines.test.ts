import { describe, expect, it } from "vitest";
import { countPendingQuestions, placementOf, routinesWithQuestions } from "./routines";
import type { AnalysisSnapshot, AskedQuestion, ReviewDecision } from "./types";

function makeQuestion(overrides: Partial<AskedQuestion> = {}): AskedQuestion {
  return {
    id: "q",
    text: "Question",
    reference: "",
    category: "Category",
    documentCode: "A",
    coverage: 0.5,
    needsReview: false,
    ...overrides,
  };
}

function makeSnapshot(questions: AskedQuestion[]): AnalysisSnapshot {
  return {
    isExample: false,
    documentOwners: [],
    lastRunLabel: "",
    questions,
    documents: [
      { code: "A", name: "Rutine A", revisedLabel: "" },
      { code: "B", name: "Rutine B", revisedLabel: "" },
      { code: "C", name: "Rutine C", revisedLabel: "" },
    ],
    sources: [],
  };
}

function decisionsFrom(decisions: Record<string, ReviewDecision>) {
  return (questionId: string): ReviewDecision | undefined => decisions[questionId];
}

const NO_DECISIONS = decisionsFrom({});

describe("placementOf", () => {
  it("puts a matched question on its best routine", () => {
    expect(placementOf(makeQuestion({ documentCode: "B" }), undefined)).toEqual({
      kind: "routine",
      routineCode: "B",
      byHand: false,
    });
  });

  it("holds back a question that needs review until HR decides", () => {
    expect(placementOf(makeQuestion({ needsReview: true }), undefined)).toEqual({ kind: "pending" });
  });

  it("puts a question on the routine HR chose, whatever matched best", () => {
    const placement = placementOf(makeQuestion({ needsReview: true, documentCode: "A" }), {
      kind: "mapped",
      routineCode: "C",
    });
    expect(placement).toEqual({ kind: "routine", routineCode: "C", byHand: true });
  });

  it("takes a discarded question out of every routine", () => {
    expect(placementOf(makeQuestion(), { kind: "discarded" })).toEqual({ kind: "discarded" });
  });
});

describe("routinesWithQuestions", () => {
  const questions = [
    makeQuestion({ id: "1", documentCode: "A", coverage: 0.2 }),
    makeQuestion({ id: "2", documentCode: "A", coverage: 0.4 }),
    makeQuestion({ id: "3", documentCode: "B", coverage: 0.6 }),
    makeQuestion({ id: "4", documentCode: "B", coverage: 0.1, needsReview: true }),
  ];

  it("groups questions on their routine and averages their coverage", () => {
    const routines = routinesWithQuestions(makeSnapshot(questions), NO_DECISIONS);

    expect(routines.map((stats) => [stats.routine.code, stats.questionCount])).toEqual([
      ["A", 2],
      ["B", 1],
    ]);
    expect(routines[0]?.meanCoverage).toBeCloseTo(0.3);
  });

  it("leaves out routines that no question belongs to", () => {
    const codes = routinesWithQuestions(makeSnapshot(questions), NO_DECISIONS).map(
      (stats) => stats.routine.code,
    );
    expect(codes).not.toContain("C");
  });

  it("moves a question HR mapped by hand and marks it as such", () => {
    const routines = routinesWithQuestions(
      makeSnapshot(questions),
      decisionsFrom({ "4": { kind: "mapped", routineCode: "C" } }),
    );

    const routineC = routines.find((stats) => stats.routine.code === "C");
    expect(routineC?.questions.map(({ question, byHand }) => [question.id, byHand])).toEqual([
      ["4", true],
    ]);
    expect(routineC?.meanCoverage).toBeCloseTo(0.1);
  });

  it("drops discarded questions from the routine they matched", () => {
    const routines = routinesWithQuestions(
      makeSnapshot(questions),
      decisionsFrom({ "1": { kind: "discarded" } }),
    );
    expect(routines[0]?.questionCount).toBe(1);
  });
});

describe("countPendingQuestions", () => {
  const snapshot = makeSnapshot([
    makeQuestion({ id: "1" }),
    makeQuestion({ id: "2", needsReview: true }),
    makeQuestion({ id: "3", needsReview: true }),
  ]);

  it("counts the questions still waiting for HR", () => {
    expect(countPendingQuestions(snapshot, NO_DECISIONS)).toBe(2);
  });

  it("stops counting a question once HR has decided", () => {
    const decisionOf = decisionsFrom({ "2": { kind: "discarded" } });
    expect(countPendingQuestions(snapshot, decisionOf)).toBe(1);
  });
});
