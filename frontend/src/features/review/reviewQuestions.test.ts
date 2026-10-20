import { describe, expect, it } from "vitest";
import type { AskedQuestion, ReviewDecision } from "../../domain/types";
import { matchesReviewFilter, reviewItems } from "./reviewQuestions";

function makeQuestion(overrides: Partial<AskedQuestion> = {}): AskedQuestion {
  return {
    id: "q",
    text: "Question",
    reference: "",
    category: "Category",
    documentCode: "A",
    coverage: 0.5,
    needsReview: true,
    ...overrides,
  };
}

const QUESTIONS = [
  makeQuestion({ id: "matched", needsReview: false }),
  makeQuestion({ id: "high", coverage: 0.3 }),
  makeQuestion({ id: "low", coverage: 0.1 }),
];

function decisionsFrom(decisions: Record<string, ReviewDecision>) {
  return (questionId: string): ReviewDecision | undefined => decisions[questionId];
}

describe("reviewItems", () => {
  it("lists only the questions that need review, lowest score first", () => {
    const items = reviewItems(QUESTIONS, decisionsFrom({}));
    expect(items.map((item) => item.question.id)).toEqual(["low", "high"]);
  });

  it("keeps a question in the list after HR decided, so the decision can be undone", () => {
    const items = reviewItems(QUESTIONS, decisionsFrom({ low: { kind: "discarded" } }));
    expect(items.map((item) => item.question.id)).toEqual(["low", "high"]);
  });
});

describe("matchesReviewFilter", () => {
  const items = reviewItems(
    QUESTIONS,
    decisionsFrom({
      low: { kind: "discarded" },
      high: { kind: "mapped", routineCode: "B" },
    }),
  );

  it("sorts each item under the pill that matches what HR decided", () => {
    const byFilter = (filter: "pending" | "mapped" | "discarded") =>
      items.filter((item) => matchesReviewFilter(item, filter)).map((item) => item.question.id);

    expect(byFilter("pending")).toEqual([]);
    expect(byFilter("mapped")).toEqual(["high"]);
    expect(byFilter("discarded")).toEqual(["low"]);
  });
});
