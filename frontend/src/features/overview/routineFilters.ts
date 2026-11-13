/** The status pills and the coverage dropdown above the work list. */

import { COVERAGE_BANDS, COVERAGE_BAND_LABEL, STATUS_LABEL, STATUS_OPTIONS } from "../../domain/labels";
import { coverageBand, type CoverageBand, type ScoredRoutine } from "../../domain/priority";
import type { RoutineCode, RoutineStatus } from "../../domain/types";

export type RoutineFilter = "all" | RoutineStatus;

export const ROUTINE_FILTERS: { key: RoutineFilter; label: string }[] = [
  { key: "all", label: "Alle" },
  ...STATUS_OPTIONS.map((status) => ({ key: status, label: STATUS_LABEL[status] })),
];

export const COVERAGE_FILTER_OPTIONS: { value: CoverageBand; label: string }[] = COVERAGE_BANDS.map((band) => ({
  value: band,
  label: COVERAGE_BAND_LABEL[band],
}));

/** No bands picked means no filtering, so an empty filter shows every routine. */
export function filterByCoverage(scored: ScoredRoutine[], bands: CoverageBand[]): ScoredRoutine[] {
  if (bands.length === 0) return scored;
  return scored.filter((entry) => bands.includes(coverageBand(entry.stats.meanCoverage)));
}

export function filterRoutines(
  scored: ScoredRoutine[],
  filter: RoutineFilter,
  statusOf: (routineCode: RoutineCode) => RoutineStatus,
): ScoredRoutine[] {
  if (filter === "all") return scored;
  return scored.filter((entry) => statusOf(entry.stats.routine.code) === filter);
}
