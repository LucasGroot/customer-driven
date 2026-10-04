import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { FilterPill } from "../../components/FilterPill";
import { MeterBar } from "../../components/MeterBar";
import { SelectField } from "../../components/SelectField";
import { COVERAGE_BAND_COLOR, PRIORITY_BAND_COLOR } from "../../components/bandColors";
import { PRIORITY_BAND_LABEL, STATUS_LABEL, STATUS_OPTIONS, formatPercent } from "../../domain/labels";
import { coverageBand, priorityBand, priorityScore } from "../../domain/priority";
import type { AnalysisSnapshot, KnowledgeGap, PriorityWeights } from "../../domain/types";
import type { GapReview } from "../../hooks/useGapReview";
import { priorityFactors } from "./priorityFactors";
import styles from "./GapDetailView.module.css";
import { classNames } from "../../components/classNames";

interface GapDetailViewProps {
  gap: KnowledgeGap;
  snapshot: AnalysisSnapshot;
  weights: PriorityWeights;
  thresholdPercent: number;
  review: GapReview;
  backLabel: string;
  onBack: () => void;
}

export function GapDetailView({
  gap,
  snapshot,
  weights,
  thresholdPercent,
  review,
  backLabel,
  onBack,
}: GapDetailViewProps) {
  const score = priorityScore(gap, weights);
  const band = priorityBand(score);
  const factors = priorityFactors(gap, weights, thresholdPercent, snapshot.totalTickets);
  const currentStatus = review.statusOf(gap.id);
  const owner = review.ownerOf(gap.id, gap.documentOwner);

  return (
    <section className={styles.view}>
      <Button variant="link" onClick={onBack}>
        ← {backLabel}
      </Button>

      <div className={styles.header}>
        <div className={styles.headerText}>
          <div className={styles.category}>{gap.category}</div>
          <h1 className={styles.title}>{gap.topic}</h1>
          <p className={styles.summary}>{gap.summary}</p>
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
            <div className={styles.scoreValue}>{gap.ticketCount}</div>
            <div className={styles.scoreNote}>siste måned</div>
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

      <div className={styles.columns}>
        <Card title="Slik spør folk">
          {gap.questions.map((question) => (
            <blockquote key={question.reference} className={styles.quote}>
              <p className={styles.quoteText}>{question.text}</p>
              <cite className={styles.quoteMeta}>{question.reference}</cite>
            </blockquote>
          ))}
          <p className={styles.note}>{gap.questionsNote}</p>
        </Card>

        <Card title="Nærmeste dokumenter i Kvaliteket">
          {gap.routines.map((routine) => {
            const color = COVERAGE_BAND_COLOR[coverageBand(routine.similarity)];
            return (
              <div key={routine.reference} className={styles.routine}>
                <div className={styles.routineHead}>
                  <span className={styles.routineName}>{routine.name}</span>
                  <span className={styles.routinePercent} style={{ color }}>
                    {formatPercent(routine.similarity)}
                  </span>
                </div>
                <MeterBar value={routine.similarity} color={color} />
                <div className={styles.routineMeta}>{routine.reference}</div>
              </div>
            );
          })}
          <p className={styles.verdict}>{gap.verdict}</p>
        </Card>
      </div>

      <Card title="Status">
        <div className={styles.statusOptions}>
          {STATUS_OPTIONS.map((status) => (
            <FilterPill
              key={status}
              label={STATUS_LABEL[status]}
              selected={currentStatus === status}
              onSelect={() => {
                review.setStatus(gap.id, status);
              }}
            />
          ))}
        </div>

        <div className={styles.assignment}>
          <SelectField
            label="Dokumenteier"
            layout="stacked"
            value={owner}
            options={snapshot.documentOwners.map((candidate) => ({
              value: candidate,
              label: candidate,
            }))}
            onChange={(candidate) => {
              review.assignOwner(gap.id, candidate);
            }}
          />
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Frist</span>
            <span className={styles.dueDate}>{gap.dueDate}</span>
          </div>
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
