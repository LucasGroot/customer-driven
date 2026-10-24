/** The status pills and the coverage cut-off above the work list. */

import { STATUS_LABEL, STATUS_OPTIONS } from "../../domain/labels";
import { isWellCovered, type ScoredRoutine } from "../../domain/priority";
import type { RoutineCode, RoutineStatus } from "../../domain/types";

export type RoutineFilter = "all" | RoutineStatus;

export const ROUTINE_FILTERS: { key: RoutineFilter; label: string }[] = [
  { key: "all", label: "Alle" },
  ...STATUS_OPTIONS.map((status) => ({ key: status, label: STATUS_LABEL[status] })),
];

export function hideWellCovered(scored: ScoredRoutine[], hideAbovePercent: number): ScoredRoutine[] {
  return scored.filter((entry) => !isWellCovered(entry.stats, hideAbovePercent));
}

export function filterRoutines(
  scored: ScoredRoutine[],
  filter: RoutineFilter,
  statusOf: (routineCode: RoutineCode) => RoutineStatus,
): ScoredRoutine[] {
  if (filter === "all") return scored;
  return scored.filter((entry) => statusOf(entry.stats.routine.code) === filter);
}
