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
import type { RoutineReview } from "../../hooks/useRoutineReview";
import { priorityFactors } from "./priorityFactors";
import styles from "./RoutineDetailView.module.css";
import { classNames } from "../../components/classNames";
import { useState } from "react";
import { RoutineSelect } from "../review/RoutineSelect";
import type {
  PriorityWeights,
  RoutineCluster,
  RoutineCode,
  RoutineDocument,
  RoutineStatus,
} from "../../domain/types";
import { routinePdfUrl } from "./routinePdf";
import { groupRoutineQuestions } from "./routineClusters";

type QuestionItem = RoutineStats["questions"][number];

interface QuestionRowProps {
  item: QuestionItem;
  /** Every routine except the current one. */
  otherRoutines: RoutineDocument[];
  review: RoutineReview;
}

function formatQuestionCount(count: number): string {
  return `${String(count)} ${count === 1 ? "henvendelse" : "henvendelser"}`;
}

function QuestionRow({ item: { question, byHand }, otherRoutines, review }: QuestionRowProps) {
  // Empty until HR picks a routine, so nothing moves by accident.
  const [targetCode, setTargetCode] = useState<RoutineCode>("");

  return (
    <div className={styles.question}>
      <div className={styles.questionText}>
        <p className={styles.quoteText}>{question.text}</p>
        <div className={styles.quoteMeta}>
          {question.reference}
          {byHand ? " · knyttet til rutinen manuelt" : ""}
        </div>
      </div>
      <CoverageMeter coverage={question.coverage} />
      <div className={styles.moveActions}>
        <RoutineSelect
          value={targetCode}
          routines={otherRoutines}
          placeholder="Flytt til rutine …"
          label={`Flytt henvendelse ${question.reference} til rutine`}
          onChange={setTargetCode}
        />
        <div className={styles.moveButtons}>
          {targetCode !== "" ? (
            <Button
              variant="secondary"
              onClick={() => {
                review.mapTo(question.id, targetCode);
              }}
            >
              Flytt<span className="visuallyHidden"> henvendelse {question.reference}</span>
            </Button>
          ) : null}
          <Button
            variant="danger"
            onClick={() => {
              review.discard(question.id);
            }}
          >
            Forkast<span className="visuallyHidden"> henvendelse {question.reference}</span>
          </Button>
          {byHand ? (
            <Button
              variant="link"
              onClick={() => {
                review.undoDecision(question.id);
              }}
            >
              Angre<span className="visuallyHidden"> for henvendelse {question.reference}</span>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}


interface RoutineDetailViewProps {
  stats: RoutineStats;
  routineClusters: RoutineCluster[];
  allRoutines: RoutineDocument[];
  /** The people the routine can be given to when it is set to Under behandling. */
  ownerCandidates: string[];
  weights: PriorityWeights;
  review: RoutineReview;
  backLabel: string;
  onBack: () => void;
}

export function RoutineDetailView({
  stats,
  routineClusters,
  allRoutines,
  ownerCandidates,
  weights,
  review,
  backLabel,
  onBack,
}: RoutineDetailViewProps) {
  const { routine } = stats;
  const pdfUrl = routinePdfUrl(routine);
  const score = priorityScore(stats, weights);
  const band = priorityBand(score);
  const factors = priorityFactors(stats, weights);
  const currentStatus = review.statusOf(routine.code);
  const lowestScoreFirst = (a: QuestionItem, b: QuestionItem) => a.question.coverage - b.question.coverage;
  const { clusters, other } = groupRoutineQuestions(stats.questions, routineClusters, routine.code);
  const owner = review.ownerOf(routine.code);
  const isInProgress = currentStatus === "in-progress";
  // Under behandling needs an owner, so choosing it first only opens the owner field
  const [isChoosingOwner, setIsChoosingOwner] = useState(false);
  const shownStatus: RoutineStatus = isInProgress || isChoosingOwner ? "in-progress" : "unprocessed";
  const ownerOptions = [
    ...(owner === undefined ? [{ value: "", label: "Velg rutineeier" }] : []),
    ...ownerCandidates.map((candidate) => ({ value: candidate, label: candidate })),
  ];

  const selectStatus = (status: RoutineStatus) => {
    if (status === "unprocessed") {
      setIsChoosingOwner(false);
      if (isInProgress) review.markUnprocessed(routine.code);
      return;
    }
    if (!isInProgress) setIsChoosingOwner(true);
  };
  const questionsLowestScoreFirst = [...stats.questions].sort(
    (a, b) => a.question.coverage - b.question.coverage,
  );
  const otherRoutines = allRoutines.filter((candidate) => candidate.code !== routine.code);

  return (
    <section className={styles.view}>
      <Button variant="link" onClick={onBack}>
        <span aria-hidden="true">← </span>
        {backLabel}
      </Button>

      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title} tabIndex={-1}>
            {routine.name}
          </h1>
          <p className={styles.summary}>{routine.uploadedLabel}</p>
        </div>
        
        <div className={styles.headerSide}>
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
          {pdfUrl !== null ? (
            <div className={styles.pdfActions}>
              <a className={styles.pdfLink} href={pdfUrl} target="_blank" rel="noopener noreferrer">
                Åpne PDF<span className="visuallyHidden"> (åpnes i ny fane)</span>
              </a>
              <a className={styles.pdfLink} href={pdfUrl} download>
                Last ned PDF
              </a>
            </div>
          ) : null}
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

      <Card title="Status">
        <div className={styles.statusOptions} role="group" aria-label="Status for rutinen">
          {STATUS_OPTIONS.map((status) => (
            <FilterPill
              key={status}
              label={STATUS_LABEL[status]}
              selected={shownStatus === status}
              onSelect={() => {
                selectStatus(status);
              }}
            />
          ))}
        </div>

        <div className={styles.assignment}>
          {shownStatus === "in-progress" ? (
            <SelectField
              label="Rutineeier"
              layout="stacked"
              value={owner ?? ""}
              options={ownerOptions}
              onChange={(candidate) => {
                if (candidate === "") return;
                setIsChoosingOwner(false);
                review.startProcessing(routine.code, candidate);
              }}
            />
          ) : (
            <p className={styles.ownerHint}>En rutine som er ubehandlet har ingen eier.</p>
          )}
          {/* Always rendered, so screen readers announce the hint when it appears */}
          <div role="status">
            {isChoosingOwner ? (
              <p className={styles.ownerHint}>Velg en rutineeier for å sette status til Under behandling.</p>
            ) : null}
          </div>
          <div
            className={classNames(styles.savedNote, review.savedNote !== null && styles.saved)}
            aria-live="polite"
          >
            {review.savedNote ?? "Endringer lagres automatisk"}
          </div>
        </div>
      </Card>

      <Card title="Henvendelser knyttet til rutinen">
        {clusters.map(({ cluster, questions, meanCoverage }) => (
          <details key={cluster.id} className={styles.cluster}>
            <summary className={styles.clusterSummary}>
              <span className={styles.clusterTitle}>{cluster.title}</span>
              <span className={styles.clusterCount}>{formatQuestionCount(questions.length)}</span>
              <CoverageMeter coverage={meanCoverage} />
            </summary>
            <div className={styles.clusterQuestions}>
              {[...questions].sort(lowestScoreFirst).map((item) => (
                <QuestionRow key={item.question.id} item={item} otherRoutines={otherRoutines} review={review} />
              ))}
            </div>
          </details>
        ))}

        {clusters.length > 0 && other.length > 0 ? (
          <p className={styles.otherHeading}>Øvrige henvendelser · {other.length}</p>
        ) : null}

        {[...other].sort(lowestScoreFirst).map((item) => (
          <QuestionRow key={item.question.id} item={item} otherRoutines={otherRoutines} review={review} />
        ))}
      </Card>

      
    </section>
  );
}
