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
  /** The latest change of any kind, shown on the routine page. */
  savedNote: string | null;
  /** The latest change to a question only, shown on the review page where an owner means nothing. */
  questionNote: string | null;
  /** Set when the backend could not store a change or could not be read. */
  saveError: string | null;
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

export function useRoutineReview(accessToken: string): RoutineReview {
  const [owners, setOwners] = useState<Record<RoutineCode, string>>({});
  const [decisions, setDecisions] = useState<Record<QuestionId, ReviewDecision>>({});
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [questionNote, setQuestionNote] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  /** Replaces the local state with what the backend has stored. */
  const reload = useCallback(
    (signal?: AbortSignal) => {
      if (!accessToken) return; // wait until the token is available
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

  /**
   * Shows the note once the backend has stored the change; on failure, goes back to the stored state.
   * A change to a question also sets questionNote.
   */
  const save = useCallback(
    (request: Promise<void>, note: string, aboutQuestions = false) => {
      request.then(
        () => {
          setSaveError(null);
          setSavedNote(note);
          if (aboutQuestions) setQuestionNote(note);
        },
        () => {
          setSaveError("Kunne ikke lagre endringen. Siste lagrede versjon vises.");
          reload();
        },
      );
    },
    [reload],
  );

  const startProcessing = useCallback(
    (routineCode: RoutineCode, owner: string) => {
      setOwners((current) => ({ ...current, [routineCode]: owner }));
      save(saveOwner(accessToken, routineCode, owner), `Tildelt ${owner}`);
    },
    [accessToken, save],
  );

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
      save(saveDecisions(accessToken, questionIds, decision), describeChange(questionIds.length, what), true);
    },
    [accessToken, save],
  );

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

  const undoDecisions = useCallback(
    (questionIds: QuestionId[]) => {
      setDecisions((current) =>
        Object.fromEntries(Object.entries(current).filter(([id]) => !questionIds.includes(id))),
      );
      save(saveUndo(accessToken, questionIds), describeChange(questionIds.length, "lagt tilbake"), true);
    },
    [accessToken, save],
  );

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
    saveError,
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
