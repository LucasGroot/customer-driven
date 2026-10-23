/**
 * Restates a routine's score as the two things it is made of. The numbers come
 * from the same breakdown the score itself uses, so the explanation cannot
 * drift away from the ranking it explains.
 */

import { formatPercent } from "../../domain/labels";
import { scoreBreakdown } from "../../domain/priority";
import type { RoutineStats } from "../../domain/routines";
import type { PriorityWeights } from "../../domain/types";

interface PriorityFactor {
  label: string;
  weightLabel: string;
  value: number;
  note: string;
}

export function priorityFactors(stats: RoutineStats, weights: PriorityWeights): PriorityFactor[] {
  const factor = scoreBreakdown(stats);
  return [
    {
      label: "Hvor mange spør",
      weightLabel: `${String(weights.volume)} %`,
      value: factor.volume,
      note: `${String(stats.questionCount)} henvendelser er knyttet til rutinen`,
    },
    {
      label: "Treff mot rutine",
      weightLabel: `${String(weights.coverage)} %`,
      value: factor.coverage,
      note: `Snittscore ${formatPercent(stats.meanCoverage)} på henvendelsene som er knyttet til rutinen`,
    },
  ];
}
