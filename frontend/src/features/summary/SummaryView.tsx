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
import { coverageBand, isWellCovered } from "../../domain/priority";
import type { RoutineStats } from "../../domain/routines";
import type { AnalysisSnapshot } from "../../domain/types";
import type { RoutineReview } from "../../hooks/useRoutineReview";
import styles from "./SummaryView.module.css";

interface SummaryViewProps {
  snapshot: AnalysisSnapshot;
  routines: RoutineStats[];
  pendingCount: number;
  review: RoutineReview;
  hideAbovePercent: number;
}

export function SummaryView({
  snapshot,
  routines,
  pendingCount,
  review,
  hideAbovePercent,
}: SummaryViewProps) {
  const total = routines.length || 1;
  const shownCount = routines.filter((stats) => !isWellCovered(stats, hideAbovePercent)).length;
  const coverageCounts = COVERAGE_BANDS.map((band) => ({
    band,
    count: routines.filter((stats) => coverageBand(stats.meanCoverage) === band).length,
  }));
  const statusCounts = STATUS_OPTIONS.map((status) => ({
    status,
    count: routines.filter((stats) => review.statusOf(stats.routine.code) === status).length,
  }));

  return (
    <section className={styles.view}>
      <PageIntro
        title="Oversikt"
        lead="Status for siste analyse: hvor mange henvendelser og rutiner som er sammenlignet, og hvordan rutinene fordeler seg."
      />

      <StatGrid>
        <StatCard label="Henvendelser" value={String(snapshot.questions.length)} note="analysert" />
        <StatCard label="Rutiner" value={String(snapshot.documents.length)} note="i Kvaliteket" />
        <StatCard
          label="Rutiner med henvendelser"
          value={String(routines.length)}
          note={`${String(shownCount)} vises i listen`}
        />
        <StatCard
          label="Til gjennomgang"
          value={String(pendingCount)}
          note="henvendelser uten rutine"
        />
      </StatGrid>

      <div className={styles.columns}>
        <Card title="Snittscore for rutinene">
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

        <Card title="Status på rutinene">
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
