import { CoverageMeter } from "../../components/CoverageMeter";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { StatusBadge } from "../../components/StatusBadge";
import { PRIORITY_BAND_COLOR } from "../../components/bandColors";
import type { ScoredGap } from "../../domain/priority";
import type { GapStatus, KnowledgeGapId } from "../../domain/types";
import styles from "./GapTable.module.css";

const COLUMNS: DataTableColumn[] = [
  { label: "#", width: "56px" },
  { label: "Tema fra henvendelser" },
  { label: "Dekning i rutine", width: "170px" },
  { label: "Henvendelser", width: "120px" },
  { label: "Status", width: "160px" },
  { label: "Prioritet", width: "96px", align: "right" },
];

interface GapTableProps {
  rows: ScoredGap[];
  statusOf: (gapId: KnowledgeGapId) => GapStatus;
  onOpenGap: (gapId: KnowledgeGapId) => void;
}

export function GapTable({ rows, statusOf, onOpenGap }: GapTableProps) {
  return (
    <DataTable
      caption="Temaer fra henvendelser, sortert etter prioritet"
      columns={COLUMNS}
      isEmpty={rows.length === 0}
      emptyMessage="Ingen temaer passer til dette filteret."
    >
      {rows.map(({ gap, score, band }, index) => (
        <tr
          key={gap.id}
          className={styles.row}
          onClick={() => {
            onOpenGap(gap.id);
          }}
        >
          <td className={styles.rank}>{index + 1}</td>
          <td>
            <button
              type="button"
              className={styles.topicButton}
              onClick={(event) => {
                event.stopPropagation();
                onOpenGap(gap.id);
              }}
            >
              {gap.topic}
            </button>
            <div className={styles.nearest}>{gap.nearestMatchLine}</div>
          </td>
          <td>
            <CoverageMeter coverage={gap.coverage} />
          </td>
          <td className={styles.ticketCount}>{gap.ticketCount}</td>
          <td>
            <StatusBadge status={statusOf(gap.id)} />
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
