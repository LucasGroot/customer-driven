import { CoverageMeter } from "../../components/CoverageMeter";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { StatusBadge } from "../../components/StatusBadge";
import { PRIORITY_BAND_COLOR } from "../../components/bandColors";
import type { SortState } from "../../components/sort";
import { STATUS_OPTIONS } from "../../domain/labels";
import type { ScoredRoutine } from "../../domain/priority";
import type { RoutineCode, RoutineStatus } from "../../domain/types";
import styles from "./RoutineTable.module.css";

const TOOLTIP = "TODO: complete";

type RoutineSortKey = "rank" | "name" | "coverage" | "questions" | "status" | "score";

const COLUMNS: DataTableColumn[] = [
  { label: "#", width: "56px", tooltip: TOOLTIP, sortKey: "rank" },
  { label: "Rutine", tooltip: TOOLTIP, sortKey: "name" },
  { label: "Snittscore", width: "170px", tooltip: TOOLTIP, sortKey: "coverage" },
  { label: "Henvendelser", width: "120px", tooltip: TOOLTIP, sortKey: "questions" },
  { label: "Status", width: "160px", tooltip: TOOLTIP, sortKey: "status" },
  { label: "Prioritet", width: "96px", align: "right", tooltip: TOOLTIP, sortKey: "score" },
];

interface RoutineTableProps {
  rows: ScoredRoutine[];
  statusOf: (routineCode: RoutineCode) => RoutineStatus;
  ownerOf: (routineCode: RoutineCode) => string | undefined;
  sort: SortState | null;
  onSortChange: (sortKey: string) => void;
  onOpenRoutine: (routineCode: RoutineCode) => void;
}

/**
 * Sorts a copy of `rows`. `rows` arrive in priority order, so the priority rank is
 * the original index, and it also breaks ties between equal values.
 */
function sortRows(
  rows: ScoredRoutine[],
  sort: SortState | null,
  statusOf: (routineCode: RoutineCode) => RoutineStatus,
): { entry: ScoredRoutine; rank: number }[] {
  const ranked = rows.map((entry, index) => ({ entry, rank: index + 1 }));
  if (sort === null) return ranked;

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
      case "score":
        return a.score - b.score;
      case "rank":
        return 0;
    }
  };

  return [...ranked].sort((a, b) => {
    // Rank 1 is the highest priority, so "ascending" on # keeps the default order.
    const byKey =
      key === "rank" ? a.rank - b.rank : compare(a.entry, b.entry);
    return byKey !== 0 ? byKey * factor : a.rank - b.rank;
  });
}

export function RoutineTable({ rows, statusOf, ownerOf, sort, onSortChange, onOpenRoutine }: RoutineTableProps) {
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
      {sorted.map(({ entry: { stats, score, band }, rank }) => (
        <tr
          key={stats.routine.code}
          className={styles.row}
          onClick={() => {
            onOpenRoutine(stats.routine.code);
          }}
        >
          <td className={styles.rank}>{rank}</td>
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
            <StatusBadge status={statusOf(stats.routine.code)} owner={ownerOf(stats.routine.code)} />
          </td>
          <td>
            <div className={styles.score}>
              <span className={styles.scoreValue}>{score}</span>
              <span
                className={styles.bandMarker}
                style={{ background: PRIORITY_BAND_COLOR[band] }}
              />
            </div>
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
