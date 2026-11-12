import { useState } from "react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import type { RoutineCode, RoutineDocument } from "../../domain/types";
import type { RoutineReview } from "../../hooks/useRoutineReview";
import { mostCommonBestMatch, type ReviewGroupView } from "./reviewQuestions";
import { ReviewTable } from "./ReviewTable";
import { RoutineSelect } from "./RoutineSelect";
import styles from "./ReviewGroupCard.module.css";

interface ReviewGroupCardProps {
  view: ReviewGroupView;
  routines: RoutineDocument[];
  review: RoutineReview;
}

/** A group of similar questions, decided on as one, or opened to decide on one question at a time. */
export function ReviewGroupCard({ view, routines, review }: ReviewGroupCardProps) {
  const { group, heading, items } = view;
  const [chosenCode, setChosenCode] = useState<RoutineCode>(
    mostCommonBestMatch(items) ?? heading.documentCode,
  );
  const questionIds = items.map((item) => item.question.id);

  return (
    <Card>
      <div className={styles.header}>
        <div className={styles.headingText}>
          <h2 className={styles.heading}>{group.title}</h2>
          <p className={styles.count}>
            {items.length} {items.length === 1 ? "henvendelse" : "henvendelser"} i gruppen
          </p>
        </div>
        <div className={styles.actions}>
          <RoutineSelect
            value={chosenCode}
            routines={routines}
            label={`Rutine for gruppen «${group.title}»`}
            onChange={setChosenCode}
          />
          <div className={styles.buttons}>
            <Button
              variant="secondary"
              onClick={() => {
                review.mapManyTo(questionIds, chosenCode);
              }}
            >
              Knytt alle til rutine<span className="visuallyHidden"> i gruppen «{group.title}»</span>
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                review.discardMany(questionIds);
              }}
            >
              Forkast alle<span className="visuallyHidden"> i gruppen «{group.title}»</span>
            </Button>
          </div>
        </div>
      </div>

      <details className={styles.details}>
        <summary className={styles.summary}>
          Vis henvendelsene<span className="visuallyHidden"> i gruppen «{group.title}»</span>
        </summary>
        <ReviewTable items={items} routines={routines} review={review} emptyMessage="" />
      </details>
    </Card>
  );
}
