import { describe, expect, it } from "vitest";
import type { AskedQuestion, ReviewDecision } from "../../domain/types";
import { groupPendingItems, matchesReviewFilter, mostCommonBestMatch, reviewItems } from "./reviewQuestions";

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

const GROUP = { id: "r0", headingQuestionId: "b" };

function pendingItems(questions: AskedQuestion[], decisions: Record<string, ReviewDecision> = {}) {
  return reviewItems(questions, decisionsFrom(decisions));
}

describe("groupPendingItems", () => {
  const questions = [
    makeQuestion({ id: "a", groupId: "r0" }),
    makeQuestion({ id: "b", groupId: "r0" }),
    makeQuestion({ id: "c", groupId: "r1" }),
    makeQuestion({ id: "alone" }),
  ];
  const groups = [GROUP, { id: "r1", headingQuestionId: "c" }];

  it("puts the questions of a group together and the others alone", () => {
    const { groups: views, alone } = groupPendingItems(pendingItems(questions), groups);

    expect(views.map((view) => view.items.map((item) => item.question.id))).toEqual([["a", "b"], ["c"]]);
    expect(alone.map((item) => item.question.id)).toEqual(["alone"]);
  });

  it("uses the question that stands for the group as its heading", () => {
    const { groups: views } = groupPendingItems(pendingItems(questions), groups);

    expect(views[0]?.heading.id).toBe("b");
  });

  it("puts the largest group first, whatever the order they came in", () => {
    const { groups: views } = groupPendingItems(pendingItems(questions), [groups[1] ?? GROUP, GROUP]);

    expect(views.map((view) => view.group.id)).toEqual(["r0", "r1"]);
  });

  it("takes decided questions out, and a group with none left", () => {
    const decisions = { c: { kind: "discarded" } } as const;

    const { groups: views } = groupPendingItems(pendingItems(questions, decisions), groups);

    expect(views.map((view) => view.group.id)).toEqual(["r0"]);
  });

  it("takes another question as heading when the one that stands for the group is decided", () => {
    const decisions = { b: { kind: "discarded" } } as const;

    const { groups: views } = groupPendingItems(pendingItems(questions, decisions), groups);

    expect(views[0]?.heading.id).toBe("a");
  });
});

describe("mostCommonBestMatch", () => {
  it("returns the routine most of the questions matched best", () => {
    const items = reviewItems(
      [
        makeQuestion({ id: "1", documentCode: "A" }),
        makeQuestion({ id: "2", documentCode: "B" }),
        makeQuestion({ id: "3", documentCode: "B" }),
      ],
      decisionsFrom({}),
    );

    expect(mostCommonBestMatch(items)).toBe("B");
  });

  it("returns nothing when there are no questions", () => {
    expect(mostCommonBestMatch([])).toBeUndefined();
  });
});

describe("a restored question", () => {
  const questions = [
    makeQuestion({ id: "a", groupId: "r0" }),
    makeQuestion({ id: "b", groupId: "r0" }),
  ];
  const groups = [{ id: "r0", headingQuestionId: "a" }];

  it("comes back to its group once the decision is undone", () => {
    const discarded = { b: { kind: "discarded" } } as const;

    const before = groupPendingItems(reviewItems(questions, decisionsFrom(discarded)), groups);
    const after = groupPendingItems(reviewItems(questions, decisionsFrom({})), groups);

    expect(before.groups[0]?.items.map((item) => item.question.id)).toEqual(["a"]);
    expect(after.groups[0]?.items.map((item) => item.question.id)).toEqual(["a", "b"]);
  });
});
