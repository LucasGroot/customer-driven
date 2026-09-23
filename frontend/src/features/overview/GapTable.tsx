import { MeterBar } from "../../components/MeterBar";
import { StatusBadge } from "../../components/StatusBadge";
import { COVERAGE_BAND_COLOR, PRIORITY_BAND_COLOR, trendColor } from "../../components/bandColors";
import { describeTrend, formatCoverage, formatTrend } from "../../domain/labels";
import { coverageBand, type ScoredGap } from "../../domain/priority";
import type { GapDecision, KnowledgeGapId } from "../../domain/types";
import styles from "./GapTable.module.css";

interface GapTableProps {
  rows: ScoredGap[];
  decisionOf: (gapId: KnowledgeGapId) => GapDecision | undefined;
  onOpenGap: (gapId: KnowledgeGapId) => void;
}

export function GapTable({ rows, decisionOf, onOpenGap }: GapTableProps) {
  return (
    <div className={styles.panel}>
      <table className={styles.table}>
        <caption className="visuallyHidden">
          Temaer fra henvendelser, sortert etter prioritet
        </caption>
        <colgroup>
          <col className={styles.colRank} />
          <col />
          <col className={styles.colCoverage} />
          <col className={styles.colTickets} />
          <col className={styles.colStatus} />
          <col className={styles.colScore} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Tema fra henvendelser</th>
            <th scope="col">Dekning</th>
            <th scope="col">Antall</th>
            <th scope="col">Status</th>
            <th scope="col">Prioritet</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ gap, score, band }, index) => {
            const coverage = coverageBand(gap.coverage);
            const coverageColor = COVERAGE_BAND_COLOR[coverage];
            return (
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
                  <div className={styles.coverage}>
                    <span className={styles.coverageLabel} style={{ color: coverageColor }}>
                      {formatCoverage(gap.coverage, coverage)}
                    </span>
                    <MeterBar value={gap.coverage} color={coverageColor} />
                  </div>
                </td>
                <td>
                  <div className={styles.tickets}>
                    <span className={styles.ticketCount}>{gap.ticketCount}</span>
                    <span
                      className={styles.trend}
                      style={{ color: trendColor(gap.trendPercent) }}
                      title={describeTrend(gap.trendPercent)}
                    >
                      {formatTrend(gap.trendPercent)}
                    </span>
                  </div>
                </td>
                <td>
                  <StatusBadge decision={decisionOf(gap.id)} />
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
            );
          })}
          {rows.length === 0 ? (
            <tr>
              <td className={styles.empty} colSpan={6}>
                Ingen temaer passer til dette filteret.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
