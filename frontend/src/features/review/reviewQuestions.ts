/** Which questions the review page lists, and how its pills sort them. */

import { placementOf, type DecisionOf, type Placement } from "../../domain/routines";
import type { AskedQuestion, ReviewGroup, RoutineCode } from "../../domain/types";

export type ReviewFilter = "pending" | "mapped" | "discarded";

export const REVIEW_FILTERS: { key: ReviewFilter; label: string }[] = [
  { key: "pending", label: "Venter" },
  { key: "mapped", label: "Knyttet til rutine" },
  { key: "discarded", label: "Forkastet" },
];

export interface ReviewItem {
  question: AskedQuestion;
  placement: Placement;
}

/**
 * The questions HR has to place, plus the ones HR has already placed or
 * discarded so a decision can be undone. Lowest score first, because the
 * worst matches are the likeliest to be questions that do not belong anywhere.
 */
export function reviewItems(questions: AskedQuestion[], decisionOf: DecisionOf): ReviewItem[] {
  return questions
    .filter((question) => question.needsReview || decisionOf(question.id) !== undefined)
    .map((question) => ({ question, placement: placementOf(question, decisionOf(question.id)) }))
    .sort((a, b) => a.question.coverage - b.question.coverage);
}

export function matchesReviewFilter({ placement }: ReviewItem, filter: ReviewFilter): boolean {
  if (filter === "pending") return placement.kind === "pending";
  if (filter === "discarded") return placement.kind === "discarded";
  return placement.kind === "routine";
}

export interface ReviewGroupView {
  group: ReviewGroup;
  /** The question that stands for the group, or the first one left if that one is decided. */
  heading: AskedQuestion;
  /** The questions of the group that still wait for HR. */
  items: ReviewItem[];
}

export interface PendingItems {
  groups: ReviewGroupView[];
  /** The questions that wait for HR and belong to no group. */
  alone: ReviewItem[];
}

/**
 * Splits the questions waiting for HR into groups, the largest first, and the ones that
 * stand alone. A group disappears once all of its questions are decided.
 */
export function groupPendingItems(items: ReviewItem[], groups: ReviewGroup[]): PendingItems {
  const pending = items.filter((item) => item.placement.kind === "pending");
  const groupIds = new Set(groups.map((group) => group.id));

  const views = groups.flatMap((group) => {
    const members = pending.filter((item) => item.question.groupId === group.id);
    const first = members[0];
    if (first === undefined) return [];
    const heading =
      members.find((item) => item.question.id === group.headingQuestionId) ?? first;
    return [{ group, heading: heading.question, items: members }];
  });

  return {
    groups: views.sort((a, b) => b.items.length - a.items.length),
    alone: pending.filter(
      (item) => item.question.groupId === undefined || !groupIds.has(item.question.groupId),
    ),
  };
}

/** The routine that matched best for most of the questions, to suggest for the whole group. */
export function mostCommonBestMatch(items: ReviewItem[]): RoutineCode | undefined {
  const counts = new Map<RoutineCode, number>();
  for (const { question } of items) {
    counts.set(question.documentCode, (counts.get(question.documentCode) ?? 0) + 1);
  }

  let mostCommon: RoutineCode | undefined;
  let highestCount = 0;
  for (const [routineCode, count] of counts) {
    if (count > highestCount) {
      mostCommon = routineCode;
      highestCount = count;
    }
  }
  return mostCommon;
}
