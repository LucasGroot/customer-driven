import { useCallback, useEffect, useState } from "react";
import {
  fetchReview, saveDecisions, saveOwner, saveStatus, undoDecisions,
} from "../api/review";
import { UNASSIGNED_OWNER, formatSavedAt } from "../domain/labels";
import type { DecisionOf } from "../domain/routines";
import type { QuestionId, ReviewDecision, RoutineCode, RoutineStatus } from "../domain/types";

export interface RoutineReview {
  statusOf: (routineCode: RoutineCode) => RoutineStatus;
  /** Undefined for a routine nobody is working on. */
  ownerOf: (routineCode: RoutineCode) => string | undefined;
  decisionOf: DecisionOf;
  savedNote: string | null;
  saveError: string | null;
  setStatus: (routineCode: RoutineCode, status: RoutineStatus) => void;
  assignOwner: (routineCode: RoutineCode, owner: string) => void;
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
  const [saveError, setSaveError] = useState<string | null>(null);

  /** Replaces the local state with what the backend has stored. */
  const reload = useCallback((signal?: AbortSignal) => {
    const request = new AbortController();
    fetchReview(signal ?? request.signal).then(
      (review) => {
        setStatuses(review.statuses);
        setOwners(review.owners);
        setDecisions(review.decisions);
      },
      () => {
        if (!signal?.aborted) setSaveError("Kunne ikke hente lagrede vurderinger.");
      },
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    reload(controller.signal);
    return () => {
      controller.abort();
    };
  }, [reload]);

  /** Shows the note once the backend has stored the change; on failure, goes back to the stored state. */
  const save = useCallback(
    (request: Promise<void>, note: string) => {
      request.then(
        () => {
          setSaveError(null);
          setSavedNote(note);
        },
        () => {
          setSaveError("Kunne ikke lagre endringen. Siste lagrede versjon vises.");
          reload();
        },
      );
    },
    [reload],
  );

  const setStatus = useCallback(
    (routineCode: RoutineCode, status: RoutineStatus) => {
      setStatuses((current) => ({ ...current, [routineCode]: status }));
      save(saveStatus(routineCode, status), formatSavedAt(new Date()));
    },
    [save],
  );

  const assignOwner = useCallback(
    (routineCode: RoutineCode, owner: string) => {
      setOwners((current) => ({ ...current, [routineCode]: owner }));
      save(saveOwner(routineCode, owner), `Tildelt ${owner}`);
    },
    [save],
  );

  const decide = useCallback(
    (questionIds: QuestionId[], decision: ReviewDecision) => {
      setDecisions((current) => ({
        ...current,
        ...Object.fromEntries(questionIds.map((questionId) => [questionId, decision])),
      }));
      save(saveDecisions(questionIds, decision), formatSavedAt(new Date()));
    },
    [save],
  );
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
    setSavedNote(describeChange(questionIds.length, what));
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
    setDecisions((current) =>
      Object.fromEntries(Object.entries(current).filter(([id]) => !questionIds.includes(id))),
    );
    setSavedNote(describeChange(questionIds.length, "lagt tilbake"));
  }, []);

  const undoDecision = useCallback(
    (questionId: QuestionId) => {
      undoDecisionsFor([questionId]);
    },
    [undoDecisionsFor],
  );

  const ownerOf = useCallback((routineCode: RoutineCode) => owners[routineCode], [owners]);

  /** A routine is under treatment exactly when someone owns it, so the two can never disagree. */
  const statusOf = useCallback(
    (routineCode: RoutineCode): RoutineStatus =>
      owners[routineCode] === undefined ? "unprocessed" : "in-progress",
    [owners],
  );

  const decisionOf = useCallback(
    (questionId: QuestionId): ReviewDecision | undefined => decisions[questionId],
    [decisions],
  );

  return {
    statusOf, ownerOf, decisionOf, savedNote, saveError,
    setStatus, assignOwner, discard, discardMany, mapTo, mapManyTo,
    undoDecision, undoDecisions: undoDecisionsFor,
    statusOf,
    ownerOf,
    decisionOf,
    savedNote,
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