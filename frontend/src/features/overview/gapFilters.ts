/** The quick filters above the work list. */

import type { ScoredGap } from "../../domain/priority";
import type { GapDecision, KnowledgeGapId } from "../../domain/types";

export type GapFilter = "all" | "high" | "undecided" | "rising";

export const GAP_FILTERS: { key: GapFilter; label: string }[] = [
  { key: "all", label: "Alle temaer" },
  { key: "high", label: "Kun høy prioritet" },
  { key: "undecided", label: "Status mangler" },
  { key: "rising", label: "Økende" },
];

/** Growth above this counts as a rising topic. */
const RISING_TREND_PERCENT = 10;

export function filterGaps(
  scored: ScoredGap[],
  filter: GapFilter,
  decisionOf: (gapId: KnowledgeGapId) => GapDecision | undefined,
): ScoredGap[] {
  switch (filter) {
    case "high":
      return scored.filter((entry) => entry.band === "high");
    case "undecided":
      return scored.filter((entry) => decisionOf(entry.gap.id) === undefined);
    case "rising":
      return scored.filter((entry) => entry.gap.trendPercent > RISING_TREND_PERCENT);
    case "all":
      return scored;
  }
}
