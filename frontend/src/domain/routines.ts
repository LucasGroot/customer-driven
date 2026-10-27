/**
 * Works out which questions belong to which routine once HR's review is
 * applied. The snapshot only says which routine matched best; a question HR
 * mapped by hand or discarded moves accordingly.
 */

import type {
  AnalysisSnapshot,
  AskedQuestion,
  QuestionId,
  ReviewDecision,
  RoutineCode,
  RoutineDocument,
} from "./types";

export type DecisionOf = (questionId: QuestionId) => ReviewDecision | undefined;

/** Where a question ends up once HR's decisions are applied. */
export type Placement =
  | { kind: "routine"; routineCode: RoutineCode; byHand: boolean }
  | { kind: "pending" }
  | { kind: "discarded" };

export function placementOf(
  question: AskedQuestion,
  decision: ReviewDecision | undefined,
): Placement {
  if (decision?.kind === "discarded") return { kind: "discarded" };
  if (decision?.kind === "mapped") {
    return { kind: "routine", routineCode: decision.routineCode, byHand: true };
  }
  if (question.needsReview) return { kind: "pending" };
  return { kind: "routine", routineCode: question.documentCode, byHand: false };
}

export interface PlacedQuestion {
  question: AskedQuestion;
  byHand: boolean;
}

export interface RoutineStats {
  routine: RoutineDocument;
  questions: PlacedQuestion[];
  questionCount: number;
  /**
   * Mean best-match similarity of the questions placed on the routine, 0-1. A
   * question mapped by hand counts with its own best-match score, because the
   * snapshot has no similarity to the routine HR chose.
   */
  meanCoverage: number;
}

/** The routines that have at least one question placed on them. */
export function routinesWithQuestions(
  snapshot: AnalysisSnapshot,
  decisionOf: DecisionOf,
): RoutineStats[] {
  const placedByRoutine = new Map<RoutineCode, PlacedQuestion[]>();
  for (const question of snapshot.questions) {
    const placement = placementOf(question, decisionOf(question.id));
    if (placement.kind !== "routine") continue;
    placedByRoutine.set(placement.routineCode, [
      ...(placedByRoutine.get(placement.routineCode) ?? []),
      { question, byHand: placement.byHand },
    ]);
  }

  return snapshot.documents.flatMap((routine) => {
    const questions = placedByRoutine.get(routine.code);
    if (questions === undefined) return [];
    const totalCoverage = questions.reduce((sum, { question }) => sum + question.coverage, 0);
    return [
      { routine, questions, questionCount: questions.length, meanCoverage: totalCoverage / questions.length },
    ];
  });
}

export function countPendingQuestions(snapshot: AnalysisSnapshot, decisionOf: DecisionOf): number {
  return snapshot.questions.filter(
    (question) => placementOf(question, decisionOf(question.id)).kind === "pending",
  ).length;
}
