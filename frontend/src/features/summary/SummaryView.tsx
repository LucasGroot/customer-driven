import { Card } from "../../components/Card";
import { InfoBubble } from "../../components/InfoBubble";
import { MeterBar } from "../../components/MeterBar";
import { PageIntro } from "../../components/PageIntro";
import { StatCard } from "../../components/StatCard";
import { StatGrid } from "../../components/StatGrid";
import { COVERAGE_BAND_COLOR, STATUS_COLOR } from "../../components/bandColors";
import {
  COVERAGE_BANDS,
  COVERAGE_BAND_DESCRIPTION,
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
  onOpenReview?: () => void;
}

export function SummaryView({
  snapshot,
  routines,
  pendingCount,
  review,
  hideAbovePercent,
  onOpenReview,
}: SummaryViewProps) {
  const total = routines.length || 1;
  // The coverage bars show every routine, also those no question points to
  const routineCount = snapshot.documents.length || 1;
  const withoutQuestionsCount = snapshot.documents.length - routines.length;
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

      <div className={styles.columns}>
        <Card title="Snittdekning for rutinene">
          <div className={styles.bands}>
            {coverageCounts.map(({ band, count }) => (
              <div key={band} className={styles.bandRow}>
                <span className={styles.bandLabel}>
                  {COVERAGE_BAND_RANGE_LABEL[band]}
                  <InfoBubble
                    subject={COVERAGE_BAND_RANGE_LABEL[band]}
                    text={COVERAGE_BAND_DESCRIPTION[band]}
                    topic="bands"
                  />
                </span>
                <MeterBar value={count / routineCount} color={COVERAGE_BAND_COLOR[band]} />
                <span className={styles.count}>{count}</span>
              </div>
            ))}
            <div className={styles.bandRow}>
              <span className={styles.bandLabel}>
                Uten henvendelser
                <InfoBubble
                  subject="Uten henvendelser"
                  text="Rutiner som ikke er beste treff for noen henvendelse, og som derfor ikke har noen snittdekning. De vises ikke i Prioriterte rutiner, men kan finnes under Søk."
                  topic="suggested-routine"
                />
              </span>
              <MeterBar value={withoutQuestionsCount / routineCount} color="var(--color-text-dim)" />
              <span className={styles.count}>{withoutQuestionsCount}</span>
            </div>
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

      <StatGrid>
        <StatCard
          label="Til gjennomgang"
          value={String(pendingCount)}
          note="henvendelser uten rutine"
          onClick={onOpenReview}
        />
        <StatCard
          label="Rutiner med henvendelser"
          value={`${String(routines.length)} / ${String(snapshot.documents.length)}`}
          note={`${String(shownCount)} vises i listen`}
        />
        <StatCard label="Henvendelser" value={String(snapshot.questions.length)} note="analysert" />
      </StatGrid>

      <Card title="Datagrunnlag">
        <div>
          {snapshot.sources.map((source) => (
            <div key={source.name} className={styles.source}>
              <span className={styles.sourceName}>{source.name}</span>
              <span className={styles.sourceDetail}>
                {source.count} {source.unit}{" "}
                <span className={styles.sourceUploaded}>· lastet opp {source.uploadedLabel}</span>
              </span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
