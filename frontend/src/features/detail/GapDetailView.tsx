import { useId } from "react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { MeterBar } from "../../components/MeterBar";
import { COVERAGE_BAND_COLOR, PRIORITY_BAND_COLOR } from "../../components/bandColors";
import { DECISION_LABEL, DECISION_OPTIONS, PRIORITY_BAND_LABEL, formatPercent } from "../../domain/labels";
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
  onBack: () => void;
}

export function GapDetailView({
  gap,
  snapshot,
  weights,
  thresholdPercent,
  review,
  onBack,
}: GapDetailViewProps) {
  const ownerFieldId = useId();
  const score = priorityScore(gap, weights);
  const band = priorityBand(score);
  const factors = priorityFactors(gap, weights, thresholdPercent, snapshot.totalTickets);
  const selectedDecision = review.decisionOf(gap.id);
  const owner = review.ownerOf(gap.id, gap.documentOwner);

  return (
    <section className={styles.view}>
      <Button variant="link" onClick={onBack}>
        ← Tilbake til oversikten
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

      <Card title="Beslutning">
        <div className={styles.decisionOptions}>
          {DECISION_OPTIONS.map((decision) => {
            const selected = selectedDecision === decision;
            return (
              <button
                key={decision}
                type="button"
                aria-pressed={selected}
                className={
                  selected
                    ? classNames(styles.decisionButton, styles.decisionSelected)
                    : styles.decisionButton
                }
                onClick={() => {
                  review.decide(gap.id, decision);
                }}
              >
                {DECISION_LABEL[decision]}
              </button>
            );
          })}
        </div>

        <div className={styles.assignment}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor={ownerFieldId}>
              Dokumenteier
            </label>
            <select
              id={ownerFieldId}
              className={styles.select}
              value={owner}
              onChange={(event) => {
                review.assignOwner(gap.id, event.target.value);
              }}
            >
              {snapshot.documentOwners.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {candidate}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Frist</span>
            <span className={styles.dueDate}>{gap.dueDate}</span>
          </div>
          <div
            className={styles.savedNote}
            aria-live="polite"
            style={{
              color:
                review.savedNote === null
                  ? "var(--color-text-faint)"
                  : "var(--color-band-low)",
            }}
          >
            {review.savedNote ?? "Endringer lagres automatisk"}
          </div>
        </div>
      </Card>
    </section>
  );
}
