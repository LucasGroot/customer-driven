import { Fragment, useState } from "react";
import { Button } from "../../components/Button";
import { CoverageMeter } from "../../components/CoverageMeter";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import type { KnowledgeGapId } from "../../domain/types";
import { ListedBadge } from "./ListedBadge";
import type { QuestionResult } from "./searchResults";
import styles from "./SearchTable.module.css";

const COLUMNS: DataTableColumn[] = [
  { label: "Spørsmål" },
  { label: "Tema", width: "20%" },
  { label: "Beste dokument", width: "20%" },
  { label: "Dekning", width: "160px" },
  { label: "Tema i listen", width: "140px" },
];

interface QuestionTableProps {
  results: QuestionResult[];
  hideAbovePercent: number;
  onOpenGap: (gapId: KnowledgeGapId) => void;
}

/** Why a question's topic is, or is not, in the prioritised list. */
function listReason({ question, listed }: QuestionResult, hideAbovePercent: number): string {
  if (listed) return "Temaet står i den prioriterte listen.";
  if (question.gapId !== undefined) {
    return `Temaet er skjult fordi rutinene dekker det over ${String(hideAbovePercent)} %.`;
  }
  return "Rutinene dekker dette godt nok til at temaet ikke er med i listen.";
}

export function QuestionTable({ results, hideAbovePercent, onOpenGap }: QuestionTableProps) {
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
      caption="Spørsmål fra ServiceNow og beste treff i Kvaliteket"
      columns={COLUMNS}
      isEmpty={results.length === 0}
      emptyMessage="Ingen spørsmål passer til søket."
    >
      {results.map((result) => {
        const { question, document, listed } = result;
        const { gapId } = question;
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
              </td>
              <td className={styles.soft}>{question.topic}</td>
              <td>
                <div>{document?.name ?? "Ukjent dokument"}</div>
                <div className={styles.meta}>{question.documentCode}</div>
              </td>
              <td>
                <CoverageMeter coverage={question.coverage} />
              </td>
              <td>
                <ListedBadge listed={listed} />
              </td>
            </tr>
            {isOpen ? (
              <tr id={detailId} className={styles.detailRow}>
                <td colSpan={COLUMNS.length}>
                  <div className={styles.detail}>
                    <span className={styles.meta}>Henvendelse {question.reference}</span>
                    <span>{listReason(result, hideAbovePercent)}</span>
                    {listed && gapId !== undefined ? (
                      <Button
                        variant="link"
                        onClick={() => {
                          onOpenGap(gapId);
                        }}
                      >
                        Åpne temaet
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
