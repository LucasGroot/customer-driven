/** The status pills and the coverage cut-off above the work list. */

import type { ScoredGap } from "../../domain/priority";
import type { GapStatus, KnowledgeGapId } from "../../domain/types";

export type GapFilter = "all" | GapStatus;

export const GAP_FILTERS: { key: GapFilter; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "new", label: "Ny" },
  { key: "updating", label: "Under oppdatering" },
  { key: "done", label: "Behandlet" },
];

export const DEFAULT_HIDE_ABOVE_PERCENT = 70;

/** Drops the topics the routines already cover better than the cut-off. */
export function hideWellCovered(scored: ScoredGap[], hideAbovePercent: number): ScoredGap[] {
  return scored.filter((entry) => entry.gap.coverage * 100 <= hideAbovePercent);
}

export function filterGaps(
  scored: ScoredGap[],
  filter: GapFilter,
  statusOf: (gapId: KnowledgeGapId) => GapStatus,
): ScoredGap[] {
  if (filter === "all") return scored;
  return scored.filter((entry) => statusOf(entry.gap.id) === filter);
}
