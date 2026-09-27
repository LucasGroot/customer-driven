/**
 * HR's own annotations on top of an analysis run: what was decided about each
 * gap's status and who owns the document. Kept in memory only - persisting this needs
 * the backend, and nothing here belongs in browser storage.
 */

import { useCallback, useState } from "react";
import { formatSavedAt } from "../domain/labels";
import type { GapStatus, KnowledgeGapId } from "../domain/types";

export interface GapReview {
  statusOf: (gapId: KnowledgeGapId) => GapStatus;
  ownerOf: (gapId: KnowledgeGapId, fallback: string) => string;
  savedNote: string | null;
  setStatus: (gapId: KnowledgeGapId, status: GapStatus) => void;
  assignOwner: (gapId: KnowledgeGapId, owner: string) => void;
  noteAction: (note: string) => void;
}

export function useGapReview(
  initialStatuses: Record<KnowledgeGapId, GapStatus>,
): GapReview {
  const [statuses, setStatuses] = useState<Record<KnowledgeGapId, GapStatus>>(
    () => ({ ...initialStatuses }),
  );
  const [owners, setOwners] = useState<Record<KnowledgeGapId, string>>({});
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const setStatus = useCallback((gapId: KnowledgeGapId, status: GapStatus) => {
    setStatuses((current) => ({ ...current, [gapId]: status }));
    setSavedNote(formatSavedAt(new Date()));
  }, []);

  const assignOwner = useCallback((gapId: KnowledgeGapId, owner: string) => {
    setOwners((current) => ({ ...current, [gapId]: owner }));
    setSavedNote(`Tildelt ${owner}`);
  }, []);

  /** A gap nobody has touched yet is new. */
  const statusOf = useCallback(
    (gapId: KnowledgeGapId): GapStatus => statuses[gapId] ?? "new",
    [statuses],
  );

  const ownerOf = useCallback(
    (gapId: KnowledgeGapId, fallback: string) => owners[gapId] ?? fallback,
    [owners],
  );

  const noteAction = useCallback((note: string) => {
    setSavedNote(note);
  }, []);

  return {
    statusOf,
    ownerOf,
    savedNote,
    setStatus,
    assignOwner,
    noteAction,
  };
}
