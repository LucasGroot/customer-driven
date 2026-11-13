/** The status pills and the coverage dropdown above the work list. */

import { COVERAGE_BANDS, COVERAGE_BAND_LABEL, STATUS_LABEL, STATUS_OPTIONS } from "../../domain/labels";
import { coverageBand, type CoverageBand, type ScoredRoutine } from "../../domain/priority";
import type { RoutineCode, RoutineStatus } from "../../domain/types";

export type RoutineFilter = "all" | RoutineStatus;
export type CoverageFilter = "all" | CoverageBand;

export const ROUTINE_FILTERS: { key: RoutineFilter; label: string }[] = [
  { key: "all", label: "Alle" },
  ...STATUS_OPTIONS.map((status) => ({ key: status, label: STATUS_LABEL[status] })),
];

export const COVERAGE_FILTER_OPTIONS: { value: CoverageFilter; label: string }[] = [
  { value: "all", label: "Alle" },
  ...COVERAGE_BANDS.map((band) => ({ value: band, label: COVERAGE_BAND_LABEL[band] })),
];

export function filterByCoverage(scored: ScoredRoutine[], filter: CoverageFilter): ScoredRoutine[] {
  if (filter === "all") return scored;
  return scored.filter((entry) => coverageBand(entry.stats.meanCoverage) === filter);
}

export function filterRoutines(
  scored: ScoredRoutine[],
  filter: RoutineFilter,
  statusOf: (routineCode: RoutineCode) => RoutineStatus,
): ScoredRoutine[] {
  if (filter === "all") return scored;
  return scored.filter((entry) => statusOf(entry.stats.routine.code) === filter);
}
