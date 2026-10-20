/** Which questions the review page lists, and how its pills sort them. */

import { placementOf, type DecisionOf, type Placement } from "../../domain/routines";
import type { AskedQuestion } from "../../domain/types";

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
