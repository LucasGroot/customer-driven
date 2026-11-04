import { CoverageMeter } from "../../components/CoverageMeter";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import type { RoutineCode } from "../../domain/types";
import styles from "./SearchTable.module.css";
import type { SortState } from "../../components/sort";
import { sortDocumentResults, type DocumentResult } from "./searchResults";

const COLUMNS: DataTableColumn[] = [
  {
    label: "Rutine",
    tooltip: "En rutine i Kvaliteket, med dagen den ble lastet opp.",
    aboutTopic: "data",
    sortKey: "name",
  },
  {
    label: "Beste treff for",
    width: "150px",
    tooltip: "Antall henvendelser der denne rutinen passer best.",
    aboutTopic: "suggested-routine",
    sortKey: "count",
  },
  {
    label: "Snittdekning",
    width: "160px",
    tooltip: "Gjennomsnittlig dekning for henvendelsene som er knyttet til rutinen.",
    aboutTopic: "coverage",
    sortKey: "coverage",
  },
];

interface DocumentTableProps {
  results: DocumentResult[];
  sort: SortState | null;
  onSortChange: (sortKey: string) => void;
  onOpenRoutine: (routineCode: RoutineCode) => void;
}

export function DocumentTable({ results, sort, onSortChange, onOpenRoutine }: DocumentTableProps) {
  const rows = sortDocumentResults(results, sort);
  return (
    <DataTable
      caption="Rutiner i Kvaliteket og henvendelsene de treffer"
      columns={COLUMNS}
      isEmpty={results.length === 0}
      emptyMessage="Ingen rutiner passer til søket."
      sort={sort}
      onSortChange={onSortChange}
    >
      {rows.map(({ document, questionCount, meanCoverage }) => {
      
        // A routine without any question has no detail page to open.
        const canOpen = questionCount > 0;
        return (
          <tr
            key={document.code}
            className={canOpen ? styles.clickableRow : undefined}
            onClick={
              canOpen
                ? () => {
                    onOpenRoutine(document.code);
                  }
                : undefined
            }
          >
            <td>
              {canOpen ? (
                <div className={styles.strong}>
                  <button
                    type="button"
                    className={styles.nameButton}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenRoutine(document.code);
                    }}
                  >
                    {document.name}
                  </button>
                </div>
              ) : (
                <div className={styles.strong}>{document.name}</div>
              )}
              <div className={styles.meta}>{document.uploadedLabel}</div>
            </td>
            <td className={styles.count}>
              {questionCount} {questionCount === 1 ? "henvendelse" : "henvendelser"}
            </td>
            <td>
              {meanCoverage === null ? (
                <span className={styles.soft}>Ingen treff</span>
              ) : (
                <CoverageMeter coverage={meanCoverage} />
              )}
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}
