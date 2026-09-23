/**
 * HR's own annotations on top of an analysis run: what was decided about each
 * gap and who owns the document. Kept in memory only - persisting this needs
 * the backend, and nothing here belongs in browser storage.
 */

import { useCallback, useState } from "react";
import { formatSavedAt } from "../domain/labels";
import type { GapDecision, KnowledgeGapId } from "../domain/types";

export interface GapReview {
  decisionOf: (gapId: KnowledgeGapId) => GapDecision | undefined;
  ownerOf: (gapId: KnowledgeGapId, fallback: string) => string;
  undecidedCount: (gapIds: KnowledgeGapId[]) => number;
  savedNote: string | null;
  decide: (gapId: KnowledgeGapId, decision: GapDecision) => void;
  assignOwner: (gapId: KnowledgeGapId, owner: string) => void;
  noteAction: (note: string) => void;
}

export function useGapReview(
  initialDecisions: Record<KnowledgeGapId, GapDecision>,
): GapReview {
  const [decisions, setDecisions] = useState<Record<KnowledgeGapId, GapDecision>>(
    () => ({ ...initialDecisions }),
  );
  const [owners, setOwners] = useState<Record<KnowledgeGapId, string>>({});
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const decide = useCallback((gapId: KnowledgeGapId, decision: GapDecision) => {
    setDecisions((current) => ({ ...current, [gapId]: decision }));
    setSavedNote(formatSavedAt(new Date()));
  }, []);

  const assignOwner = useCallback((gapId: KnowledgeGapId, owner: string) => {
    setOwners((current) => ({ ...current, [gapId]: owner }));
    setSavedNote(`Tildelt ${owner}`);
  }, []);

  const decisionOf = useCallback(
    (gapId: KnowledgeGapId) => decisions[gapId],
    [decisions],
  );

  const ownerOf = useCallback(
    (gapId: KnowledgeGapId, fallback: string) => owners[gapId] ?? fallback,
    [owners],
  );

  const undecidedCount = useCallback(
    (gapIds: KnowledgeGapId[]) => gapIds.filter((id) => decisions[id] === undefined).length,
    [decisions],
  );

  const noteAction = useCallback((note: string) => {
    setSavedNote(note);
  }, []);

  return {
    decisionOf,
    ownerOf,
    undecidedCount,
    savedNote,
    decide,
    assignOwner,
    noteAction,
  };
}
