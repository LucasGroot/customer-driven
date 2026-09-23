/**
 * Turns a knowledge gap into the priority score shown in the work list, and
 * decides how many of its tickets count as unanswered. These are the numbers
 * HR argues about, so they live in one place as pure functions.
 */

import type { AnalysisSnapshot, KnowledgeGap, PriorityWeights } from "./types";

export const DEFAULT_WEIGHTS: PriorityWeights = {
  volume: 35,
  coverage: 35,
  trend: 20,
  age: 10,
};

export const DEFAULT_THRESHOLD_PERCENT = 40;
export const THRESHOLD_RANGE = { min: 25, max: 60, step: 5 } as const;
export const WEIGHT_RANGE = { min: 0, max: 60, step: 5 } as const;

/** Ticket count at which a gap scores full marks on volume. */
const FULL_VOLUME_TICKETS = 40;

/** Trend is mapped from -10%..+40% onto 0..1. */
const TREND_FLOOR = -10;
const TREND_SPAN = 50;

/**
 * Half-width of the similarity spread within a cluster. Individual questions
 * scatter around the cluster mean, so a cluster straddles the threshold rather
 * than flipping from fully covered to fully uncovered at one point.
 */
const CLUSTER_SPREAD = 0.12;

function clampUnitInterval(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * How strongly a gap scores on each factor, 0-1, before weighting. The score
 * and the explanation on the detail screen are both derived from this, so the
 * bars a reader sees always add up to the number they are explaining.
 */
export function scoreBreakdown(gap: KnowledgeGap): PriorityWeights {
  return {
    volume: Math.min(1, gap.ticketCount / FULL_VOLUME_TICKETS),
    coverage: 1 - gap.coverage,
    trend: clampUnitInterval((gap.trendPercent - TREND_FLOOR) / TREND_SPAN),
    age: gap.documentAge,
  };
}

export function priorityScore(gap: KnowledgeGap, weights: PriorityWeights): number {
  const weightSum = weights.volume + weights.coverage + weights.trend + weights.age || 1;
  const factor = scoreBreakdown(gap);
  const weighted =
    factor.volume * weights.volume +
    factor.coverage * weights.coverage +
    factor.trend * weights.trend +
    factor.age * weights.age;
  return Math.round((weighted / weightSum) * 100);
}

export type PriorityBand = "high" | "medium" | "low";

export function priorityBand(score: number): PriorityBand {
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export type CoverageBand = "weak" | "partial" | "good";

export function coverageBand(coverage: number): CoverageBand {
  if (coverage < 0.3) return "weak";
  if (coverage < 0.45) return "partial";
  return "good";
}

/** Share of a cluster's tickets whose best match falls below the threshold. */
function unmatchedShare(coverage: number, thresholdPercent: number): number {
  const threshold = thresholdPercent / 100;
  return clampUnitInterval((threshold - coverage + CLUSTER_SPREAD) / (CLUSTER_SPREAD * 2));
}

export function unmatchedTicketCount(gap: KnowledgeGap, thresholdPercent: number): number {
  return Math.round(gap.ticketCount * unmatchedShare(gap.coverage, thresholdPercent));
}

export function totalUnmatchedTickets(
  snapshot: AnalysisSnapshot,
  thresholdPercent: number,
): number {
  const insideClusters = snapshot.gaps.reduce(
    (total, gap) => total + unmatchedTicketCount(gap, thresholdPercent),
    0,
  );
  const outsideClusters = Math.round(
    snapshot.ticketsOutsideClusters *
      unmatchedShare(snapshot.coverageOutsideClusters, thresholdPercent),
  );
  return insideClusters + outsideClusters;
}

export interface ScoredGap {
  gap: KnowledgeGap;
  score: number;
  band: PriorityBand;
}

/** Highest priority first - the order the work list is meant to be worked in. */
export function rankGaps(gaps: KnowledgeGap[], weights: PriorityWeights): ScoredGap[] {
  return gaps
    .map((gap) => {
      const score = priorityScore(gap, weights);
      return { gap, score, band: priorityBand(score) };
    })
    .sort((a, b) => b.score - a.score);
}
