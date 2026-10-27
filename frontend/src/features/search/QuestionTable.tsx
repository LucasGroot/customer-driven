import { Fragment, useState } from "react";
import { Button } from "../../components/Button";
import { CoverageMeter } from "../../components/CoverageMeter";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import type { Placement } from "../../domain/routines";
import type { QuestionId, RoutineCode } from "../../domain/types";
import { PlacementBadge } from "./PlacementBadge";
import type { QuestionResult } from "./searchResults";
import styles from "./SearchTable.module.css";

const COLUMNS: DataTableColumn[] = [
  { label: "Henvendelse" },
  { label: "Kategori", width: "18%" },
  { label: "Beste rutine", width: "22%" },
  { label: "Dekning", width: "160px" },
  { label: "Status", width: "160px" },
];

interface QuestionTableProps {
  results: QuestionResult[];
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

export function QuestionTable({ results, onOpenRoutine, onRestore }: QuestionTableProps) {
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
    >
      {results.map((result) => {
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
