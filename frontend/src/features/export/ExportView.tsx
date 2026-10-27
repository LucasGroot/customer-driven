import { useState } from "react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { PageIntro } from "../../components/PageIntro";
import { isWellCovered, rankRoutines } from "../../domain/priority";
import type { RoutineStats } from "../../domain/routines";
import type { PriorityWeights } from "../../domain/types";
import type { RoutineReview } from "../../hooks/useRoutineReview";
import styles from "./ExportView.module.css";

/** How many rows the report preview lists. */
const PREVIEW_ROW_COUNT = 6;

const EXPORT_FORMATS = [
  {
    format: "PDF",
    name: "Rapport til ledermøtet",
    detail: "Alle rutiner i den prioriterte listen, med prioritet og hvor godt de dekker henvendelsene.",
    callToAction: "Last ned PDF",
  },
  {
    format: "XLSX",
    name: "Arbeidsliste til dokumenteiere",
    detail: "Én rad per rutine med eier og status. Kan filtreres per eier.",
    callToAction: "Last ned Excel",
  },
] as const;

interface ExportViewProps {
  routines: RoutineStats[];
  weights: PriorityWeights;
  review: RoutineReview;
  hideAbovePercent: number;
  lastRunLabel: string;
}

/** Where an administrator downloads the prioritised list as a report. */
export function ExportView({ routines, weights, review, hideAbovePercent, lastRunLabel }: ExportViewProps) {
  const listed = routines.filter((stats) => !isWellCovered(stats, hideAbovePercent));
  const rows = rankRoutines(listed, weights).slice(0, PREVIEW_ROW_COUNT);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <section className={styles.view}>
      <PageIntro
        title="Eksporter rapport"
        lead="Bare administratorer ser denne siden. Ta med listen til ledermøtet, eller gi dokumenteierne hver sin del."
      />

      <div className={styles.cards}>
        {EXPORT_FORMATS.map((option) => (
          <div key={option.format} className={styles.card}>
            <div className={styles.format}>{option.format}</div>
            <div className={styles.name}>{option.name}</div>
            <div className={styles.detail}>{option.detail}</div>
            <div className={styles.action}>
              <Button
                variant="secondary"
                onClick={() => {
                  // Rendering the file is the backend's job; until that exists the
                  // button only confirms which report was asked for.
                  setNotice(`${option.format} er ikke koblet opp ennå`);
                }}
              >
                {option.callToAction}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.status} aria-live="polite">
        {notice}
      </div>

      <Card title="Med i rapporten">
        {rows.map(({ stats, score }, index) => (
          <div key={stats.routine.code} className={styles.row}>
            <span className={styles.rank}>{index + 1}</span>
            <span className={styles.routine}>{stats.routine.name}</span>
            <span className={styles.owner}>{review.ownerOf(stats.routine.code)}</span>
            <span className={styles.score}>{score}</span>
          </div>
        ))}
        <p className={styles.note}>
          Rapporten bruker resultatet fra siste analyse ({lastRunLabel}).
        </p>
      </Card>
    </section>
  );
}
