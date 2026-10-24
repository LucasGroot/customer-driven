/**
 * Turns a routine into the priority score shown in the work list. A routine
 * that many questions point to, and that answers them poorly, comes first.
 * These are the numbers HR argues about, so they live in one place as pure
 * functions.
 */

import type { RoutineStats } from "./routines";
import type { PriorityWeights } from "./types";

export const DEFAULT_WEIGHTS: PriorityWeights = {
  volume: 50,
  coverage: 50,
};

export const WEIGHT_RANGE = { min: 0, max: 60, step: 5 } as const;

/** Number of questions at which a routine scores full marks on volume. */
const FULL_VOLUME_QUESTIONS = 10;

/**
 * How strongly a routine scores on each factor, 0-1, before weighting. The
 * score and the explanation on the detail screen are both derived from this,
 * so the bars a reader sees always add up to the number they are explaining.
 */
export function scoreBreakdown(stats: RoutineStats): PriorityWeights {
  return {
    volume: Math.min(1, stats.questionCount / FULL_VOLUME_QUESTIONS),
    coverage: 1 - stats.meanCoverage,
  };
}

export function priorityScore(stats: RoutineStats, weights: PriorityWeights): number {
  const weightSum = weights.volume + weights.coverage || 1;
  const factor = scoreBreakdown(stats);
  const weighted = factor.volume * weights.volume + factor.coverage * weights.coverage;
  return Math.round((weighted / weightSum) * 100);
}

export type PriorityBand = "high" | "medium" | "low";

export function priorityBand(score: number): PriorityBand {
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export type CoverageBand = "weak" | "partial" | "good";

/**
 * Coverage below this is weak; from here up to GOOD_COVERAGE_FROM it is partial. Set for the
 * scores of the current embedding model, where about a tenth of the questions score under
 * 0.52 and a third over 0.65. Set again whenever the model changes.
 */
export const PARTIAL_COVERAGE_FROM = 0.52;
export const GOOD_COVERAGE_FROM = 0.65;

export function coverageBand(coverage: number): CoverageBand {
  if (coverage < PARTIAL_COVERAGE_FROM) return "weak";
  if (coverage < GOOD_COVERAGE_FROM) return "partial";
  return "good";
}

/**
 * Routines that answer their questions better than this are left out of the list by default.
 * It starts at 100 so nothing is hidden: real scores lie close together, so any lower cut-off
 * hides most routines until the scale has been calibrated.
 */
export const DEFAULT_HIDE_ABOVE_PERCENT = 100;

/** Whether a routine already answers its questions better than the cut-off. */
export function isWellCovered(stats: RoutineStats, hideAbovePercent: number): boolean {
  return stats.meanCoverage * 100 > hideAbovePercent;
}

export interface ScoredRoutine {
  stats: RoutineStats;
  score: number;
  band: PriorityBand;
}

/** Highest priority first - the order the work list is meant to be worked in. */
export function rankRoutines(routines: RoutineStats[], weights: PriorityWeights): ScoredRoutine[] {
  return routines
    .map((stats) => {
      const score = priorityScore(stats, weights);
      return { stats, score, band: priorityBand(score) };
    })
    .sort((a, b) => b.score - a.score);
}
