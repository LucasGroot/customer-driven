/**
 * Restates a gap's score as the four things it is made of. The numbers come
 * from the same breakdown the score itself uses, so the explanation cannot
 * drift away from the ranking it explains.
 */

import { describeTrend, formatPercent } from "../../domain/labels";
import { scoreBreakdown, unmatchedTicketCount } from "../../domain/priority";
import type { KnowledgeGap, PriorityWeights } from "../../domain/types";

interface PriorityFactor {
  label: string;
  weightLabel: string;
  value: number;
  note: string;
}

export function priorityFactors(
  gap: KnowledgeGap,
  weights: PriorityWeights,
  thresholdPercent: number,
  totalTickets: number,
): PriorityFactor[] {
  const factor = scoreBreakdown(gap);
  const unmatched = unmatchedTicketCount(gap, thresholdPercent);
  return [
    {
      label: "Hvor mange spør",
      weightLabel: `${String(weights.volume)} %`,
      value: factor.volume,
      note: `${String(gap.ticketCount)} henvendelser av ${String(totalTickets)} i perioden`,
    },
    {
      label: "Treff mot rutine",
      weightLabel: `${String(weights.coverage)} %`,
      value: factor.coverage,
      note: `Snittreff ${formatPercent(gap.coverage)} mot beste dokument. ${String(unmatched)} av ${String(gap.ticketCount)} henvendelser under grensen på ${String(thresholdPercent)} %.`,
    },
    {
      label: "Utvikling",
      weightLabel: `${String(weights.trend)} %`,
      value: factor.trend,
      note: describeTrend(gap.trendPercent),
    },
    {
      label: "Dokumentets alder",
      weightLabel: `${String(weights.age)} %`,
      value: factor.age,
      note: gap.documentAgeLabel,
    },
  ];
}
