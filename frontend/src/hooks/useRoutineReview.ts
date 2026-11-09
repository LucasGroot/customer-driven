import { useCallback, useEffect, useState } from "react";
import { fetchReview, saveDecisions, saveOwner, saveUndo } from "../api/review";
import { formatSavedAt } from "../domain/labels";
import type { DecisionOf } from "../domain/routines";
import type { QuestionId, ReviewDecision, RoutineCode, RoutineStatus } from "../domain/types";

export interface RoutineReview {
  statusOf: (routineCode: RoutineCode) => RoutineStatus;
  /** Undefined for a routine nobody is working on. */
  ownerOf: (routineCode: RoutineCode) => string | undefined;
  decisionOf: DecisionOf;
  savedNote: string | null;
  saveError: string | null;
  assignOwner: (routineCode: RoutineCode, owner: string) => void;
  startProcessing: (routineCode: RoutineCode, owner: string) => void;
  markUnprocessed: (routineCode: RoutineCode) => void;
  discard: (questionId: QuestionId) => void;
  discardMany: (questionIds: QuestionId[]) => void;
  mapTo: (questionId: QuestionId, routineCode: RoutineCode) => void;
  mapManyTo: (questionIds: QuestionId[], routineCode: RoutineCode) => void;
  undoDecision: (questionId: QuestionId) => void;
  undoDecisions: (questionIds: QuestionId[]) => void;
}

function describeChange(count: number, what: string): string {
  const questions = count === 1 ? "1 henvendelse" : `${String(count)} henvendelser`;
  return `${questions} ${what}. ${formatSavedAt(new Date())}`;
}

export function useRoutineReview(accessToken: string): RoutineReview {
  const [owners, setOwners] = useState<Record<RoutineCode, string>>({});
  const [decisions, setDecisions] = useState<Record<QuestionId, ReviewDecision>>({});
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  /** Replaces the local state with what the backend has stored. */
  const reload = useCallback(
    (signal?: AbortSignal) => {
      fetchReview(accessToken, signal).then(
        (review) => {
          setOwners(review.owners);
          setDecisions(review.decisions);
        },
        () => {
          if (!signal?.aborted) setSaveError("Kunne ikke hente lagrede vurderinger.");
        },
      );
    },
    [accessToken],
  );

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

  const assignOwner = useCallback(
    (routineCode: RoutineCode, owner: string) => {
      setOwners((current) => ({ ...current, [routineCode]: owner }));
      save(saveOwner(accessToken, routineCode, owner), `Tildelt ${owner}`);
    },
    [accessToken, save],
  );

  const startProcessing = assignOwner;

  const markUnprocessed = useCallback(
    (routineCode: RoutineCode) => {
      setOwners((current) => Object.fromEntries(Object.entries(current).filter(([code]) => code !== routineCode)));
      save(saveOwner(accessToken, routineCode, null), `Satt til Ubehandlet. ${formatSavedAt(new Date())}`);
    },
    [accessToken, save],
  );

  const decide = useCallback(
    (questionIds: QuestionId[], decision: ReviewDecision) => {
      setDecisions((current) => ({
        ...current,
        ...Object.fromEntries(questionIds.map((questionId) => [questionId, decision])),
      }));
      const what = decision.kind === "discarded" ? "forkastet" : "knyttet til rutine";
      save(saveDecisions(accessToken, questionIds, decision), describeChange(questionIds.length, what));
    },
    [accessToken, save],
  );

  const discardMany = useCallback((ids: QuestionId[]) => { decide(ids, { kind: "discarded" }); }, [decide]);
  const discard = useCallback((id: QuestionId) => { discardMany([id]); }, [discardMany]);
  const mapManyTo = useCallback(
    (ids: QuestionId[], routineCode: RoutineCode) => { decide(ids, { kind: "mapped", routineCode }); },
    [decide],
  );
  const mapTo = useCallback((id: QuestionId, routineCode: RoutineCode) => { mapManyTo([id], routineCode); }, [mapManyTo]);

  const undoDecisions = useCallback(
    (questionIds: QuestionId[]) => {
      setDecisions((current) =>
        Object.fromEntries(Object.entries(current).filter(([id]) => !questionIds.includes(id))),
      );
      save(saveUndo(accessToken, questionIds), describeChange(questionIds.length, "lagt tilbake"));
    },
    [accessToken, save],
  );
  const undoDecision = useCallback((id: QuestionId) => { undoDecisions([id]); }, [undoDecisions]);

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
    statusOf, ownerOf, decisionOf, savedNote, saveError,
    assignOwner, startProcessing, markUnprocessed,
    discard, discardMany, mapTo, mapManyTo, undoDecision, undoDecisions,
  };
}