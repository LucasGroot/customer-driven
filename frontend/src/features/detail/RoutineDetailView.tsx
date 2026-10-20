import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { CoverageMeter } from "../../components/CoverageMeter";
import { FilterPill } from "../../components/FilterPill";
import { MeterBar } from "../../components/MeterBar";
import { SelectField } from "../../components/SelectField";
import { PRIORITY_BAND_COLOR } from "../../components/bandColors";
import { PRIORITY_BAND_LABEL, STATUS_LABEL, STATUS_OPTIONS } from "../../domain/labels";
import { priorityBand, priorityScore } from "../../domain/priority";
import type { RoutineStats } from "../../domain/routines";
import type { PriorityWeights } from "../../domain/types";
import type { RoutineReview } from "../../hooks/useRoutineReview";
import { priorityFactors } from "./priorityFactors";
import styles from "./RoutineDetailView.module.css";
import { classNames } from "../../components/classNames";

interface RoutineDetailViewProps {
  stats: RoutineStats;
  documentOwners: string[];
  weights: PriorityWeights;
  review: RoutineReview;
  backLabel: string;
  onBack: () => void;
}

export function RoutineDetailView({
  stats,
  documentOwners,
  weights,
  review,
  backLabel,
  onBack,
}: RoutineDetailViewProps) {
  const { routine } = stats;
  const score = priorityScore(stats, weights);
  const band = priorityBand(score);
  const factors = priorityFactors(stats, weights);
  const currentStatus = review.statusOf(routine.code);
  const questionsLowestScoreFirst = [...stats.questions].sort(
    (a, b) => a.question.coverage - b.question.coverage,
  );

  return (
    <section className={styles.view}>
      <Button variant="link" onClick={onBack}>
        ← {backLabel}
      </Button>

      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{routine.name}</h1>
          {routine.revisedLabel === "" ? null : (
            <p className={styles.summary}>Revidert {routine.revisedLabel}</p>
          )}
        </div>
        <div className={styles.scorePanel}>
          <div className={styles.scoreBlock}>
            <div className={styles.scoreLabel}>Prioritet</div>
            <div className={styles.scoreValue}>{score}</div>
            <div className={styles.scoreNote} style={{ color: PRIORITY_BAND_COLOR[band] }}>
              {PRIORITY_BAND_LABEL[band]}
            </div>
          </div>
          <div className={styles.scoreBlock}>
            <div className={styles.scoreLabel}>Henvendelser</div>
            <div className={styles.scoreValue}>{stats.questionCount}</div>
            <div className={styles.scoreNote}>knyttet til rutinen</div>
          </div>
        </div>
      </div>

      <Card title="Hvorfor dette havner høyt">
        <div className={styles.factors}>
          {factors.map((factor) => (
            <div key={factor.label} className={styles.factor}>
              <div className={styles.factorHead}>
                <span className={styles.factorLabel}>{factor.label}</span>
                <span className={styles.factorWeight}>{factor.weightLabel}</span>
              </div>
              <MeterBar value={factor.value} color="var(--color-accent)" thick />
              <div className={styles.factorNote}>{factor.note}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Spørsmål knyttet til rutinen">
        {questionsLowestScoreFirst.map(({ question, byHand }) => (
          <div key={question.id} className={styles.question}>
            <div className={styles.questionText}>
              <p className={styles.quoteText}>{question.text}</p>
              <div className={styles.quoteMeta}>
                {question.reference}
                {byHand ? " · knyttet til rutinen manuelt" : ""}
              </div>
            </div>
            <CoverageMeter coverage={question.coverage} />
            {byHand ? (
              <Button
                variant="link"
                onClick={() => {
                  review.undoDecision(question.id);
                }}
              >
                Angre
              </Button>
            ) : (
              <span />
            )}
          </div>
        ))}
      </Card>

      <Card title="Status">
        <div className={styles.statusOptions}>
          {STATUS_OPTIONS.map((status) => (
            <FilterPill
              key={status}
              label={STATUS_LABEL[status]}
              selected={currentStatus === status}
              onSelect={() => {
                review.setStatus(routine.code, status);
              }}
            />
          ))}
        </div>

        <div className={styles.assignment}>
          <SelectField
            label="Dokumenteier"
            layout="stacked"
            value={review.ownerOf(routine.code)}
            options={documentOwners.map((candidate) => ({
              value: candidate,
              label: candidate,
            }))}
            onChange={(candidate) => {
              review.assignOwner(routine.code, candidate);
            }}
          />
          <div
            className={classNames(styles.savedNote, review.savedNote !== null && styles.saved)}
            aria-live="polite"
          >
            {review.savedNote ?? "Endringer lagres automatisk"}
          </div>
        </div>
      </Card>
    </section>
  );
}
