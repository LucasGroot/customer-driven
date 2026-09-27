/** The status pills and the coverage cut-off above the work list. */

import type { ScoredGap } from "../../domain/priority";
import type { GapStatus, KnowledgeGap, KnowledgeGapId } from "../../domain/types";

export type GapFilter = "all" | GapStatus;

export const GAP_FILTERS: { key: GapFilter; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "new", label: "Ny" },
  { key: "updating", label: "Under oppdatering" },
  { key: "done", label: "Behandlet" },
];

export const DEFAULT_HIDE_ABOVE_PERCENT = 70;

/** Whether the routines already cover a topic better than the cut-off. */
export function isWellCovered(gap: KnowledgeGap, hideAbovePercent: number): boolean {
  return gap.coverage * 100 > hideAbovePercent;
}

export function hideWellCovered(scored: ScoredGap[], hideAbovePercent: number): ScoredGap[] {
  return scored.filter((entry) => !isWellCovered(entry.gap, hideAbovePercent));
}

export function filterGaps(
  scored: ScoredGap[],
  filter: GapFilter,
  statusOf: (gapId: KnowledgeGapId) => GapStatus,
): ScoredGap[] {
  if (filter === "all") return scored;
  return scored.filter((entry) => statusOf(entry.gap.id) === filter);
}
