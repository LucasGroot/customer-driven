import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { PageIntro } from "../../components/PageIntro";
import { rankGaps } from "../../domain/priority";
import type { AnalysisSnapshot, PriorityWeights } from "../../domain/types";
import type { GapReview } from "../../hooks/useGapReview";
import styles from "./ExportView.module.css";

/** How many rows the report preview lists. */
const PREVIEW_ROW_COUNT = 6;

const EXPORT_FORMATS = [
  {
    format: "PDF",
    name: "Rapport til ledermøtet",
    detail:
      "Alle temaer med prioritet, begrunnelse i klartekst og anbefalt tiltak. 4 sider.",
    callToAction: "Last ned PDF",
  },
  {
    format: "XLSX",
    name: "Arbeidsliste til dokumenteiere",
    detail: "Én rad per tema med eier, status og frist. Kan filtreres per eier.",
    callToAction: "Last ned Excel",
  },
] as const;

interface ExportViewProps {
  snapshot: AnalysisSnapshot;
  weights: PriorityWeights;
  review: GapReview;
}

export function ExportView({ snapshot, weights, review }: ExportViewProps) {
  const rows = rankGaps(snapshot.gaps, weights).slice(0, PREVIEW_ROW_COUNT);

  return (
    <section className={styles.view}>
      <PageIntro
        compact
        title="Eksporter rapport"
        lead="Ta med listen til ledermøtet, eller gi dokumenteierne hver sin del."
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
                  review.noteAction(`${option.format} er ikke koblet opp ennå`);
                }}
              >
                {option.callToAction}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {review.savedNote === null ? null : (
        <div className={styles.status} aria-live="polite">
          {review.savedNote}
        </div>
      )}

      <Card title="Med i rapporten">
        {rows.map(({ gap, score }, index) => (
          <div key={gap.id} className={styles.row}>
            <span className={styles.rank}>{index + 1}</span>
            <span className={styles.topic}>{gap.topic}</span>
            <span className={styles.owner}>{review.ownerOf(gap.id, gap.documentOwner)}</span>
            <span className={styles.score}>{score}</span>
          </div>
        ))}
        <p className={styles.note}>
          Rapporten bruker resultatet fra siste analyse ({snapshot.lastRunLabel}).
        </p>
      </Card>
    </section>
  );
}
