import { useState } from "react";
import { FilterPill } from "../../components/FilterPill";
import { PageIntro } from "../../components/PageIntro";
import type { AnalysisSnapshot } from "../../domain/types";
import type { RoutineReview } from "../../hooks/useRoutineReview";
import { ReviewTable } from "./ReviewTable";
import { REVIEW_FILTERS, matchesReviewFilter, reviewItems, type ReviewFilter } from "./reviewQuestions";
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
  const routinesByName = [...snapshot.documents].sort((a, b) => a.name.localeCompare(b.name, "nb-NO"));

  return (
    <section className={styles.view}>
      <PageIntro
        title="Til gjennomgang"
        lead="Henvendelser der ingen rutine passer godt nok. Forkast spørsmål som ikke hører hjemme i en rutine, eller knytt dem til riktig rutine selv. Valgene teller med når rutinene prioriteres."
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

      <ReviewTable
        items={visible}
        routines={routinesByName}
        review={review}
        emptyMessage={EMPTY_MESSAGE[filter]}
      />
    </section>
  );
}
