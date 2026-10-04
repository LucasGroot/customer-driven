/** The status pills and the coverage cut-off above the work list. */

import { STATUS_LABEL, STATUS_OPTIONS } from "../../domain/labels";
import { isWellCovered, type ScoredGap } from "../../domain/priority";
import type { GapStatus, KnowledgeGapId } from "../../domain/types";

export type GapFilter = "all" | GapStatus;

export const GAP_FILTERS: { key: GapFilter; label: string }[] = [
  { key: "all", label: "Alle" },
  ...STATUS_OPTIONS.map((status) => ({ key: status, label: STATUS_LABEL[status] })),
];

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
