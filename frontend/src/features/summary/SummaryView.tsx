import { Card } from "../../components/Card";
import { MeterBar } from "../../components/MeterBar";
import { PageIntro } from "../../components/PageIntro";
import { StatCard } from "../../components/StatCard";
import { StatGrid } from "../../components/StatGrid";
import { COVERAGE_BAND_COLOR, STATUS_COLOR } from "../../components/bandColors";
import {
  COVERAGE_BANDS,
  COVERAGE_BAND_RANGE_LABEL,
  STATUS_LABEL,
  STATUS_OPTIONS,
} from "../../domain/labels";
import { coverageBand, listedGapIds } from "../../domain/priority";
import type { AnalysisSnapshot } from "../../domain/types";
import type { GapReview } from "../../hooks/useGapReview";
import styles from "./SummaryView.module.css";

interface SummaryViewProps {
  snapshot: AnalysisSnapshot;
  review: GapReview;
  hideAbovePercent: number;
}

export function SummaryView({ snapshot, review, hideAbovePercent }: SummaryViewProps) {
  const { gaps } = snapshot;
  const total = gaps.length || 1;
  const shownCount = listedGapIds(gaps, hideAbovePercent).size;
  const coverageCounts = COVERAGE_BANDS.map((band) => ({
    band,
    count: gaps.filter((gap) => coverageBand(gap.coverage) === band).length,
  }));
  const statusCounts = STATUS_OPTIONS.map((status) => ({
    status,
    count: gaps.filter((gap) => review.statusOf(gap.id) === status).length,
  }));

  return (
    <section className={styles.view}>
      <PageIntro
        title="Oversikt"
        lead="Status for siste analyse: hvor mange henvendelser og rutiner som er sammenlignet, og hvordan temaene fordeler seg."
      />

      <StatGrid>
        <StatCard label="Henvendelser" value={String(snapshot.totalTickets)} note="analysert" />
        <StatCard label="Rutiner" value={String(snapshot.totalRoutines)} note="i Kvaliteket" />
        <StatCard
          label="Temaer funnet"
          value={String(gaps.length)}
          note={`${String(shownCount)} vises i listen`}
        />
      </StatGrid>

      <div className={styles.columns}>
        <Card title="Dekning i rutinene">
          <div className={styles.bands}>
            {coverageCounts.map(({ band, count }) => (
              <div key={band} className={styles.bandRow}>
                <span>{COVERAGE_BAND_RANGE_LABEL[band]}</span>
                <MeterBar value={count / total} color={COVERAGE_BAND_COLOR[band]} />
                <span className={styles.count}>{count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Status på temaene">
          <div className={styles.stack} aria-hidden="true">
            {statusCounts.map(({ status, count }) =>
              count === 0 ? null : (
                <div
                  key={status}
                  style={{ width: `${String((count / total) * 100)}%`, background: STATUS_COLOR[status] }}
                />
              ),
            )}
          </div>
          <ul className={styles.legend}>
            {statusCounts.map(({ status, count }) => (
              <li key={status} className={styles.legendItem}>
                <span
                  className={styles.swatch}
                  style={{ background: STATUS_COLOR[status] }}
                  aria-hidden="true"
                />
                {STATUS_LABEL[status]} · {count}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}
