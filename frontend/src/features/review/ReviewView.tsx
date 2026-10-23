import { useState } from "react";
import { Button } from "../../components/Button";
import { FilterPill } from "../../components/FilterPill";
import { PageIntro } from "../../components/PageIntro";
import type { AnalysisSnapshot } from "../../domain/types";
import type { RoutineReview } from "../../hooks/useRoutineReview";
import { ReviewGroupCard } from "./ReviewGroupCard";
import { ReviewTable } from "./ReviewTable";
import {
  REVIEW_FILTERS,
  groupPendingItems,
  matchesReviewFilter,
  reviewItems,
  type ReviewFilter,
} from "./reviewQuestions";
import styles from "./ReviewView.module.css";

interface ReviewViewProps {
  snapshot: AnalysisSnapshot;
  review: RoutineReview;
}

const EMPTY_MESSAGE: Record<ReviewFilter, string> = {
  pending: "Ingen henvendelser venter på gjennomgang.",
  mapped: "Ingen henvendelser er knyttet til en rutine for hånd ennå.",
  discarded: "Ingen henvendelser er forkastet.",
};

export function ReviewView({ snapshot, review }: ReviewViewProps) {
  const [filter, setFilter] = useState<ReviewFilter>("pending");

  const items = reviewItems(snapshot.questions, review.decisionOf);
  const visible = items.filter((item) => matchesReviewFilter(item, filter));
  const { groups, alone } = groupPendingItems(items, snapshot.reviewGroups);
  const routinesByName = [...snapshot.documents].sort((a, b) => a.name.localeCompare(b.name, "nb-NO"));

  return (
    <section className={styles.view}>
      <PageIntro
        title="Til gjennomgang"
        lead="Henvendelser der ingen rutine passer godt nok. De som ligner hverandre er samlet i grupper: en stor gruppe betyr at flere lurer på det samme uten at en rutine svarer godt nok. Behandle en hel gruppe om gangen, eller åpne den og vurder henvendelsene hver for seg. Valgene teller med når rutinene prioriteres."
      />

      <div className={styles.pills}>
        {REVIEW_FILTERS.map((option) => (
          <FilterPill
            key={option.key}
            label={`${option.label} · ${String(items.filter((item) => matchesReviewFilter(item, option.key)).length)}`}
            selected={filter === option.key}
            onSelect={() => {
              setFilter(option.key);
            }}
          />
        ))}
      </div>

      <p className={styles.note} aria-live="polite">
        {review.savedNote ?? "Valg lagres automatisk i denne økten."}
      </p>

      {filter === "pending" ? (
        <>
          {groups.map((view) => (
            <ReviewGroupCard key={view.group.id} view={view} routines={routinesByName} review={review} />
          ))}

          {alone.length > 0 ? (
            <details className={styles.alone}>
              <summary className={styles.aloneSummary}>Enkeltstående henvendelser · {alone.length}</summary>
              <p className={styles.note}>
                Henvendelser som ikke ligner noen av de andre. De haster mindre enn gruppene, der
                flere spør om det samme.
              </p>
              <ReviewTable items={alone} routines={routinesByName} review={review} emptyMessage="" />
            </details>
          ) : null}

          {groups.length === 0 && alone.length === 0 ? (
            <p className={styles.note}>{EMPTY_MESSAGE.pending}</p>
          ) : null}
        </>
      ) : (
        <>
          {filter === "discarded" && visible.length > 0 ? (
            <div className={styles.restore}>
              <p className={styles.note}>
                Gjenopprett en henvendelse for å legge den tilbake under «Venter», i sin gruppe.
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  review.undoDecisions(visible.map((item) => item.question.id));
                }}
              >
                Gjenopprett alle
              </Button>
            </div>
          ) : null}
          <ReviewTable
            items={visible}
            routines={routinesByName}
            review={review}
            emptyMessage={EMPTY_MESSAGE[filter]}
          />
        </>
      )}
    </section>
  );
}
