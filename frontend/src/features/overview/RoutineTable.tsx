import { CoverageMeter } from "../../components/CoverageMeter";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { StatusBadge } from "../../components/StatusBadge";
import { PRIORITY_BAND_COLOR } from "../../components/bandColors";
import type { ScoredRoutine } from "../../domain/priority";
import type { RoutineCode, RoutineStatus } from "../../domain/types";
import styles from "./RoutineTable.module.css";

const COLUMNS: DataTableColumn[] = [
  { label: "#", width: "56px" },
  { label: "Rutine" },
  { label: "Snittscore", width: "170px" },
  { label: "Henvendelser", width: "120px" },
  { label: "Status", width: "160px" },
  { label: "Prioritet", width: "96px", align: "right" },
];

interface RoutineTableProps {
  rows: ScoredRoutine[];
  statusOf: (routineCode: RoutineCode) => RoutineStatus;
  onOpenRoutine: (routineCode: RoutineCode) => void;
}

export function RoutineTable({ rows, statusOf, onOpenRoutine }: RoutineTableProps) {
  return (
    <DataTable
      caption="Rutiner i Kvaliteket, sortert etter prioritet"
      columns={COLUMNS}
      isEmpty={rows.length === 0}
      emptyMessage="Ingen rutiner passer til dette filteret."
    >
      {rows.map(({ stats, score, band }, index) => (
        <tr
          key={stats.routine.code}
          className={styles.row}
          onClick={() => {
            onOpenRoutine(stats.routine.code);
          }}
        >
          <td className={styles.rank}>{index + 1}</td>
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
