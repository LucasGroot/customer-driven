import { useState } from "react";
import { Button } from "../../components/Button";
import { CoverageMeter } from "../../components/CoverageMeter";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import type { RoutineCode, RoutineDocument } from "../../domain/types";
import type { RoutineReview } from "../../hooks/useRoutineReview";
import type { ReviewItem } from "./reviewQuestions";
import styles from "./ReviewTable.module.css";

const COLUMNS: DataTableColumn[] = [
  { label: "Spørsmål" },
  { label: "Beste treff", width: "200px" },
  { label: "Valg", width: "290px" },
];

interface ReviewRowProps {
  item: ReviewItem;
  /** Every routine, alphabetically, for picking where a question belongs. */
  routines: RoutineDocument[];
  review: RoutineReview;
}

function ReviewRow({ item, routines, review }: ReviewRowProps) {
  const { question, placement } = item;
  // Starts on the best match, since the analysis was usually close when HR keeps it
  const [chosenCode, setChosenCode] = useState<RoutineCode>(question.documentCode);
  const nameOf = (code: RoutineCode) =>
    routines.find((routine) => routine.code === code)?.name ?? "ukjent rutine";

  return (
    <tr>
      <td>
        <p className={styles.text}>{question.text}</p>
        <div className={styles.meta}>
          {question.reference} · {question.category}
        </div>
      </td>
      <td>
        <div className={styles.bestMatch}>
          <span>{nameOf(question.documentCode)}</span>
          <CoverageMeter coverage={question.coverage} />
        </div>
      </td>
      <td>
        {placement.kind === "pending" ? (
          <div className={styles.actions}>
            <select
              className={styles.select}
              aria-label="Rutinen spørsmålet hører til"
              value={chosenCode}
              onChange={(event) => {
                setChosenCode(event.target.value);
              }}
            >
              {routines.map((routine) => (
                <option key={routine.code} value={routine.code}>
                  {routine.name}
                </option>
              ))}
            </select>
            <div className={styles.buttons}>
              <Button
                variant="secondary"
                onClick={() => {
                  review.mapTo(question.id, chosenCode);
                }}
              >
                Knytt til rutine
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  review.discard(question.id);
                }}
              >
                Forkast
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.actions}>
            <span className={styles.decision}>
              {placement.kind === "discarded"
                ? "Forkastet"
                : `Knyttet til ${nameOf(placement.routineCode)}`}
            </span>
            <div className={styles.buttons}>
              <Button
                variant="link"
                onClick={() => {
                  review.undoDecision(question.id);
                }}
              >
                Angre
              </Button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

interface ReviewTableProps {
  items: ReviewItem[];
  routines: RoutineDocument[];
  review: RoutineReview;
  emptyMessage: string;
}

export function ReviewTable({ items, routines, review, emptyMessage }: ReviewTableProps) {
  return (
    <DataTable
      caption="Henvendelser som ikke passet til noen rutine"
      columns={COLUMNS}
      isEmpty={items.length === 0}
      emptyMessage={emptyMessage}
    >
      {items.map((item) => (
        <ReviewRow key={item.question.id} item={item} routines={routines} review={review} />
      ))}
    </DataTable>
  );
}
