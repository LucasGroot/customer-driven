/**
 * HR's own annotations on top of an analysis run: what was decided about each
 * routine's status and owner, and about each question the analysis could not
 * place. Kept in memory only - persisting this needs the backend, and nothing
 * here belongs in browser storage.
 */

import { useCallback, useState } from "react";
import { UNASSIGNED_OWNER, formatSavedAt } from "../domain/labels";
import type { DecisionOf } from "../domain/routines";
import type { QuestionId, ReviewDecision, RoutineCode, RoutineStatus } from "../domain/types";

export interface RoutineReview {
  statusOf: (routineCode: RoutineCode) => RoutineStatus;
  ownerOf: (routineCode: RoutineCode) => string;
  decisionOf: DecisionOf;
  savedNote: string | null;
  setStatus: (routineCode: RoutineCode, status: RoutineStatus) => void;
  assignOwner: (routineCode: RoutineCode, owner: string) => void;
  discard: (questionId: QuestionId) => void;
  mapTo: (questionId: QuestionId, routineCode: RoutineCode) => void;
  undoDecision: (questionId: QuestionId) => void;
}

export function useRoutineReview(): RoutineReview {
  const [statuses, setStatuses] = useState<Record<RoutineCode, RoutineStatus>>({});
  const [owners, setOwners] = useState<Record<RoutineCode, string>>({});
  const [decisions, setDecisions] = useState<Record<QuestionId, ReviewDecision>>({});
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const setStatus = useCallback((routineCode: RoutineCode, status: RoutineStatus) => {
    setStatuses((current) => ({ ...current, [routineCode]: status }));
    setSavedNote(formatSavedAt(new Date()));
  }, []);

  const assignOwner = useCallback((routineCode: RoutineCode, owner: string) => {
    setOwners((current) => ({ ...current, [routineCode]: owner }));
    setSavedNote(`Tildelt ${owner}`);
  }, []);

  const decide = useCallback((questionId: QuestionId, decision: ReviewDecision) => {
    setDecisions((current) => ({ ...current, [questionId]: decision }));
    setSavedNote(formatSavedAt(new Date()));
  }, []);

  const discard = useCallback(
    (questionId: QuestionId) => {
      decide(questionId, { kind: "discarded" });
    },
    [decide],
  );

  const mapTo = useCallback(
    (questionId: QuestionId, routineCode: RoutineCode) => {
      decide(questionId, { kind: "mapped", routineCode });
    },
    [decide],
  );

  const undoDecision = useCallback((questionId: QuestionId) => {
    setDecisions((current) =>
      Object.fromEntries(Object.entries(current).filter(([id]) => id !== questionId)),
    );
    setSavedNote(formatSavedAt(new Date()));
  }, []);

  /** A routine nobody has touched yet is new. */
  const statusOf = useCallback(
    (routineCode: RoutineCode): RoutineStatus => statuses[routineCode] ?? "new",
    [statuses],
  );

  const ownerOf = useCallback(
    (routineCode: RoutineCode) => owners[routineCode] ?? UNASSIGNED_OWNER,
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
    setStatus,
    assignOwner,
    discard,
    mapTo,
    undoDecision,
  };
}
