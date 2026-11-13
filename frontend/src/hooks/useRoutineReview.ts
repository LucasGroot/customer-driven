/**
 * HR's own annotations on top of an analysis run: who is working on each
 * routine (which is also its status), and what was decided about each question
 * the analysis could not place. Kept in memory only - persisting this needs the backend, and nothing
 * here belongs in browser storage.
 */

import { useCallback, useState } from "react";
import { formatSavedAt } from "../domain/labels";
import type { DecisionOf } from "../domain/routines";
import type { QuestionId, ReviewDecision, RoutineCode, RoutineStatus } from "../domain/types";

export interface RoutineReview {
  statusOf: (routineCode: RoutineCode) => RoutineStatus;
  /** Undefined for a routine nobody is working on. */
  ownerOf: (routineCode: RoutineCode) => string | undefined;
  decisionOf: DecisionOf;
  /** The latest change of any kind, shown on the routine page. */
  savedNote: string | null;
  /** The latest change to a question only, shown on the review page where an owner means nothing. */
  questionNote: string | null;
  /** Sets the routine to Under behandling, with this owner. */
  startProcessing: (routineCode: RoutineCode, owner: string) => void;
  /** Sets the routine back to Ubehandlet, which has no owner. */
  markUnprocessed: (routineCode: RoutineCode) => void;
  discard: (questionId: QuestionId) => void;
  discardMany: (questionIds: QuestionId[]) => void;
  mapTo: (questionId: QuestionId, routineCode: RoutineCode) => void;
  mapManyTo: (questionIds: QuestionId[], routineCode: RoutineCode) => void;
  undoDecision: (questionId: QuestionId) => void;
  undoDecisions: (questionIds: QuestionId[]) => void;
}

/**
 * Says what happened as well as when, since the question that was acted on
 * disappears from view and screen readers only hear this note.
 */
function describeChange(count: number, what: string): string {
  const questions = count === 1 ? "1 henvendelse" : `${String(count)} henvendelser`;
  return `${questions} ${what}. ${formatSavedAt(new Date())}`;
}

export function useRoutineReview(): RoutineReview {
  const [owners, setOwners] = useState<Record<RoutineCode, string>>({});
  const [decisions, setDecisions] = useState<Record<QuestionId, ReviewDecision>>({});
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [questionNote, setQuestionNote] = useState<string | null>(null);

  const startProcessing = useCallback((routineCode: RoutineCode, owner: string) => {
    setOwners((current) => ({ ...current, [routineCode]: owner }));
    setSavedNote(`Tildelt ${owner}`);
  }, []);

  const markUnprocessed = useCallback((routineCode: RoutineCode) => {
    setOwners((current) => Object.fromEntries(Object.entries(current).filter(([code]) => code !== routineCode)));
    setSavedNote(`Satt til Ubehandlet. ${formatSavedAt(new Date())}`);
  }, []);

  const decide = useCallback((questionIds: QuestionId[], decision: ReviewDecision) => {
    setDecisions((current) => ({
      ...current,
      ...Object.fromEntries(questionIds.map((questionId) => [questionId, decision])),
    }));
    const what = decision.kind === "discarded" ? "forkastet" : "knyttet til rutine";
    const note = describeChange(questionIds.length, what);
    setSavedNote(note);
    setQuestionNote(note);
  }, []);

  const discardMany = useCallback(
    (questionIds: QuestionId[]) => {
      decide(questionIds, { kind: "discarded" });
    },
    [decide],
  );

  const discard = useCallback(
    (questionId: QuestionId) => {
      discardMany([questionId]);
    },
    [discardMany],
  );

  const mapManyTo = useCallback(
    (questionIds: QuestionId[], routineCode: RoutineCode) => {
      decide(questionIds, { kind: "mapped", routineCode });
    },
    [decide],
  );

  const mapTo = useCallback(
    (questionId: QuestionId, routineCode: RoutineCode) => {
      mapManyTo([questionId], routineCode);
    },
    [mapManyTo],
  );

  const undoDecisions = useCallback((questionIds: QuestionId[]) => {
    setDecisions((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !questionIds.includes(id))));
    const note = describeChange(questionIds.length, "lagt tilbake");
    setSavedNote(note);
    setQuestionNote(note);
  }, []);

  const undoDecision = useCallback(
    (questionId: QuestionId) => {
      undoDecisions([questionId]);
    },
    [undoDecisions],
  );

  const ownerOf = useCallback((routineCode: RoutineCode) => owners[routineCode], [owners]);

  /** A routine is under treatment exactly when someone owns it, so the two can never disagree. */
  const statusOf = useCallback(
    (routineCode: RoutineCode): RoutineStatus => (owners[routineCode] === undefined ? "unprocessed" : "in-progress"),
    [owners],
  );

  const decisionOf = useCallback(
    (questionId: QuestionId): ReviewDecision | undefined => decisions[questionId],
    [decisions],
  );

  return {
    statusOf,
    ownerOf,
    decisionOf,
    savedNote,
    questionNote,
    startProcessing,
    markUnprocessed,
    discard,
    discardMany,
    mapTo,
    mapManyTo,
    undoDecision,
    undoDecisions,
  };
}
