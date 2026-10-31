import { useCallback, useEffect, useState } from "react";
import {
  fetchReview, saveDecisions, saveOwner, saveStatus, undoDecisions,
} from "../api/review";
import { UNASSIGNED_OWNER, formatSavedAt } from "../domain/labels";
import type { DecisionOf } from "../domain/routines";
import type { QuestionId, ReviewDecision, RoutineCode, RoutineStatus } from "../domain/types";

export interface RoutineReview {
  statusOf: (routineCode: RoutineCode) => RoutineStatus;
  ownerOf: (routineCode: RoutineCode) => string;
  decisionOf: DecisionOf;
  savedNote: string | null;
  saveError: string | null;
  setStatus: (routineCode: RoutineCode, status: RoutineStatus) => void;
  assignOwner: (routineCode: RoutineCode, owner: string) => void;
  discard: (questionId: QuestionId) => void;
  discardMany: (questionIds: QuestionId[]) => void;
  mapTo: (questionId: QuestionId, routineCode: RoutineCode) => void;
  mapManyTo: (questionIds: QuestionId[], routineCode: RoutineCode) => void;
  undoDecision: (questionId: QuestionId) => void;
  undoDecisions: (questionIds: QuestionId[]) => void;
}

export function useRoutineReview(): RoutineReview {
  const [statuses, setStatuses] = useState<Record<RoutineCode, RoutineStatus>>({});
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

  const undoDecisionsFor = useCallback(
    (questionIds: QuestionId[]) => {
      setDecisions((current) =>
        Object.fromEntries(Object.entries(current).filter(([id]) => !questionIds.includes(id))),
      );
      save(undoDecisions(questionIds), formatSavedAt(new Date()));
    },
    [save],
  );

  const undoDecision = useCallback(
    (questionId: QuestionId) => {
      undoDecisionsFor([questionId]);
    },
    [undoDecisionsFor],
  );

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
    statusOf, ownerOf, decisionOf, savedNote, saveError,
    setStatus, assignOwner, discard, discardMany, mapTo, mapManyTo,
    undoDecision, undoDecisions: undoDecisionsFor,
  };
}