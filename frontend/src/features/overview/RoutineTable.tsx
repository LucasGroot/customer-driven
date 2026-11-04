import { CoverageMeter } from "../../components/CoverageMeter";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { StatusBadge } from "../../components/StatusBadge";
import type { SortState } from "../../components/sort";
import { STATUS_OPTIONS } from "../../domain/labels";
import type { ScoredRoutine } from "../../domain/priority";
import type { RoutineCode, RoutineStatus } from "../../domain/types";
import styles from "./RoutineTable.module.css";

const TOOLTIP = "TODO: complete";

type RoutineSortKey = "rank" | "name" | "coverage" | "questions" | "status";

const COLUMNS: DataTableColumn[] = [
  { label: "Rutine", tooltip: TOOLTIP, sortKey: "name" },
  { label: "Snittdekning", width: "170px", tooltip: TOOLTIP, sortKey: "coverage" },
  { label: "Henvendelser", width: "120px", tooltip: TOOLTIP, sortKey: "questions" },
  { label: "Status", width: "160px", tooltip: TOOLTIP, sortKey: "status" },
  { label: "Prioritet", width: "124px", align: "right", tooltip: TOOLTIP, sortKey: "rank" },
];

interface RoutineTableProps {
  rows: ScoredRoutine[];
  statusOf: (routineCode: RoutineCode) => RoutineStatus;
  sort: SortState | null;
  onSortChange: (sortKey: string) => void;
  onOpenRoutine: (routineCode: RoutineCode) => void;
}

/** Sorts a copy of `rows`. Equal values keep their priority order. */
function sortRows(
  rows: ScoredRoutine[],
  sort: SortState | null,
  statusOf: (routineCode: RoutineCode) => RoutineStatus,
): ScoredRoutine[] {
  if (sort === null) return rows;

  const key = sort.key as RoutineSortKey;
  const factor = sort.direction === "asc" ? 1 : -1;

  const compare = (a: ScoredRoutine, b: ScoredRoutine): number => {
    switch (key) {
      case "name":
        return a.stats.routine.name.localeCompare(b.stats.routine.name, "nb");
      case "coverage":
        return a.stats.meanCoverage - b.stats.meanCoverage;
      case "questions":
        return a.stats.questionCount - b.stats.questionCount;
      case "status":
        return (
          STATUS_OPTIONS.indexOf(statusOf(a.stats.routine.code)) -
          STATUS_OPTIONS.indexOf(statusOf(b.stats.routine.code))
        );
      case "rank":
        return a.rank - b.rank;
    }
  };

  return [...rows].sort((a, b) => {
    const byKey = compare(a, b);
    return byKey !== 0 ? byKey * factor : a.rank - b.rank;
  });
}

export function RoutineTable({ rows, statusOf, sort, onSortChange, onOpenRoutine }: RoutineTableProps) {
  const sorted = sortRows(rows, sort, statusOf);

  return (
    <DataTable
      caption="Rutiner i Kvaliteket, sortert etter prioritet"
      columns={COLUMNS}
      isEmpty={rows.length === 0}
      emptyMessage="Ingen rutiner passer til dette filteret."
      minWidth={780}
      sort={sort}
      onSortChange={onSortChange}
    >
      {sorted.map(({ stats, rank }) => (
        <tr
          key={stats.routine.code}
          className={styles.row}
          onClick={() => {
            onOpenRoutine(stats.routine.code);
          }}
        >
          <td>
            <button
              type="button"
              className={styles.nameButton}
              onClick={(event) => {
                event.stopPropagation();
                onOpenRoutine(stats.routine.code);
              }}
            >
              {stats.routine.name}
            </button>
            <div className={styles.uploaded}>{stats.routine.uploadedLabel}</div>
          </td>
          <td>
            <CoverageMeter coverage={stats.meanCoverage} />
          </td>
          <td className={styles.questionCount}>{stats.questionCount}</td>
          <td>
            <StatusBadge status={statusOf(stats.routine.code)} />
          </td>
          <td>
            <div className={styles.score}>
              <span className={styles.scoreValue}>{rank}</span>
            </div>
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
