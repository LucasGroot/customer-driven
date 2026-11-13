import { describe, expect, it } from "vitest";
import {
  countPendingQuestions,
  coverageOnRoutine,
  placementOf,
  routinesWithQuestions,
  suggestedRoutineCodes,
} from "./routines";
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
    reviewGroups: [],
    routineClusters: [],
    documents: [
      { code: "A", name: "Rutine A", uploadedLabel: "" },
      { code: "B", name: "Rutine B", uploadedLabel: "" },
      { code: "C", name: "Rutine C", uploadedLabel: "" },
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
    const codes = routinesWithQuestions(makeSnapshot(questions), NO_DECISIONS).map((stats) => stats.routine.code);
    expect(codes).not.toContain("C");
  });

  it("moves a question HR mapped by hand and marks it as such", () => {
    const routines = routinesWithQuestions(
      makeSnapshot(questions),
      decisionsFrom({ "4": { kind: "mapped", routineCode: "C" } }),
    );

    const routineC = routines.find((stats) => stats.routine.code === "C");
    expect(routineC?.questions.map(({ question, byHand }) => [question.id, byHand])).toEqual([["4", true]]);
    expect(routineC?.meanCoverage).toBeCloseTo(0.1);
  });

  it("counts a question mapped by hand with its score on the routine HR chose", () => {
    const withCandidates = makeQuestion({
      id: "5",
      documentCode: "A",
      coverage: 0.1,
      needsReview: true,
      candidates: [
        { documentCode: "A", score: 0.1 },
        { documentCode: "C", score: 0.45 },
      ],
    });
    const routines = routinesWithQuestions(
      makeSnapshot([withCandidates]),
      decisionsFrom({ "5": { kind: "mapped", routineCode: "C" } }),
    );

    expect(routines[0]?.questions[0]?.coverage).toBeCloseTo(0.45);
    expect(routines[0]?.meanCoverage).toBeCloseTo(0.45);
  });

  it("drops discarded questions from the routine they matched", () => {
    const routines = routinesWithQuestions(makeSnapshot(questions), decisionsFrom({ "1": { kind: "discarded" } }));
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

describe("coverageOnRoutine", () => {
  const question = makeQuestion({
    coverage: 0.6,
    candidates: [
      { documentCode: "A", score: 0.6 },
      { documentCode: "B", score: 0.5 },
    ],
  });

  it("gives the score the snapshot stored for that routine", () => {
    expect(coverageOnRoutine(question, "B")).toBe(0.5);
  });

  it("falls back on the best score for a routine that is not a candidate", () => {
    expect(coverageOnRoutine(question, "C")).toBe(0.6);
  });

  it("falls back on the best score in a snapshot without candidates", () => {
    expect(coverageOnRoutine(makeQuestion({ coverage: 0.3 }), "B")).toBe(0.3);
  });
});

describe("suggestedRoutineCodes", () => {
  it("lists the best candidates first and no more than five", () => {
    const candidates = ["A", "B", "C", "D", "E", "F", "G"].map((documentCode, index) => ({
      documentCode,
      score: 0.9 - index * 0.1,
    }));

    expect(suggestedRoutineCodes(makeQuestion({ candidates }))).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("suggests nothing for a snapshot without candidates", () => {
    expect(suggestedRoutineCodes(makeQuestion())).toEqual([]);
  });
});
