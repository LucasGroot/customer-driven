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
  /** How well the question matches the routine it is placed on, 0-1. */
  coverage: number;
}

/** How many candidates a routine list suggests first. */
const SUGGESTED_ROUTINES = 5;

/**
 * How well a question matches a routine. A routine HR chose that is not among
 * the stored candidates has no score, so the question counts with its best one.
 */
export function coverageOnRoutine(question: AskedQuestion, routineCode: RoutineCode): number {
  const candidate = question.candidates?.find((entry) => entry.documentCode === routineCode);
  return candidate?.score ?? question.coverage;
}

/** The routines that matched a question best, for suggesting them first. */
export function suggestedRoutineCodes(question: AskedQuestion): RoutineCode[] {
  return (question.candidates ?? []).slice(0, SUGGESTED_ROUTINES).map((entry) => entry.documentCode);
}

export interface RoutineStats {
  routine: RoutineDocument;
  questions: PlacedQuestion[];
  questionCount: number;
  /**
   * Mean similarity between the routine and the questions placed on it, 0-1. A
   * question mapped by hand counts with its score on that routine when the snapshot
   * stored it, and otherwise with its best-match score.
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
      { question, byHand: placement.byHand, coverage: coverageOnRoutine(question, placement.routineCode) },
    ]);
  }

  return snapshot.documents.flatMap((routine) => {
    const questions = placedByRoutine.get(routine.code);
    if (questions === undefined) return [];
    const totalCoverage = questions.reduce((sum, { coverage }) => sum + coverage, 0);
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
