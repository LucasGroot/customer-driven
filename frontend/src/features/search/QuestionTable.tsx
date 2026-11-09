import { Fragment, useState } from "react";
import { Button } from "../../components/Button";
import { CoverageMeter } from "../../components/CoverageMeter";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import type { Placement } from "../../domain/routines";
import type { QuestionId, RoutineCode } from "../../domain/types";
import { PlacementBadge } from "./PlacementBadge";
import { sortQuestionResults, type QuestionResult } from "./searchResults";
import styles from "./SearchTable.module.css";
import type { SortState } from "../../components/sort";

const COLUMNS: DataTableColumn[] = [
  {
    label: "Henvendelse",
    tooltip: "Henvendelsen slik den ble stilt i ServiceNow.",
    aboutTopic: "data",
    sortKey: "text",
  },
  {
    label: "Kategori",
    width: "18%",
    tooltip: "Tjenesten henvendelsen ble registrert under i ServiceNow.",
    aboutTopic: "data",
    sortKey: "category",
  },
  {
    label: "Beste rutine",
    width: "22%",
    tooltip: "Rutinen som passer best til henvendelsen. Det er et forslag og ikke en fasit.",
    aboutTopic: "suggested-routine",
    sortKey: "routine",
  },
  {
    label: "Dekning",
    width: "160px",
    tooltip: "Hvor godt rutinen passer til henvendelsen, i prosent.",
    aboutTopic: "coverage",
    sortKey: "coverage",
  },
  {
    label: "Status",
    width: "160px",
    tooltip: "Om henvendelsen er knyttet til en rutine eller må gjennomgås manuelt.",
    aboutTopic: "manual-review",
    sortKey: "status",
  },
];

interface QuestionTableProps {
  results: QuestionResult[];
  sort: SortState | null;
  onSortChange: (sortKey: string) => void;
  onOpenRoutine: (routineCode: RoutineCode) => void;
  onRestore: (questionId: QuestionId) => void;
}

/** What happened to a question, in a sentence. */
function placementReason(placement: Placement): string {
  if (placement.kind === "routine") {
    return placement.byHand
      ? "Knyttet til rutinen for hånd under gjennomgang."
      : "Knyttet til rutinen som passet best.";
  }
  if (placement.kind === "pending") {
    return "Passer ikke godt nok til noen rutine, og venter på gjennomgang.";
  }
  return "Forkastet under gjennomgang.";
}

export function QuestionTable({ results, sort, onSortChange, onOpenRoutine, onRestore }: QuestionTableProps) {
  const rows = sortQuestionResults(results, sort);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  

  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  };

  return (
    <DataTable
      caption="Henvendelser fra ServiceNow og beste treff i Kvaliteket"
      columns={COLUMNS}
      isEmpty={results.length === 0}
      emptyMessage="Ingen henvendelser passer til søket."
      minWidth={880}
      sort={sort}
      onSortChange={onSortChange}
    >
      {rows.map((result) => {
        const { question, document, placement } = result;
        const isOpen = expanded.has(question.id);
        const detailId = `question-detail-${question.id}`;
        return (
          <Fragment key={question.id}>
            <tr className={isOpen ? styles.openRow : undefined}>
              <td>
                <button
                  type="button"
                  className={styles.expandButton}
                  aria-expanded={isOpen}
                  aria-controls={detailId}
                  onClick={() => {
                    toggle(question.id);
                  }}
                >
                  <span className={styles.chevron} aria-hidden="true">
                    {isOpen ? "▾" : "▸"}
                  </span>
                  <span>{question.text}</span>
                </button>
                <div className={styles.reference}>{question.reference}</div>
              </td>
              <td className={styles.soft}>{question.category}</td>
              <td>{document?.name ?? "Ukjent rutine"}</td>
              <td>
                <CoverageMeter coverage={question.coverage} />
              </td>
              <td>
                <PlacementBadge placement={placement} />
              </td>
            </tr>
            {isOpen ? (
              <tr id={detailId} className={styles.detailRow}>
                <td colSpan={COLUMNS.length}>
                  <div className={styles.detail}>
                    <span>{placementReason(placement)}</span>
                    {placement.kind === "routine" ? (
                      <Button
                        variant="link"
                        onClick={() => {
                          onOpenRoutine(placement.routineCode);
                        }}
                      >
                        Åpne rutinen
                      </Button>
                    ) : null}
                    {placement.kind === "discarded" ? (
                      <Button
                        variant="link"
                        onClick={() => {
                          onRestore(question.id);
                        }}
                      >
                        Gjenopprett
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : null}
          </Fragment>
        );
      })}
    </DataTable>
  );
}
