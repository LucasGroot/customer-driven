import { CoverageMeter } from "../../components/CoverageMeter";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import type { DocumentResult } from "./searchResults";
import styles from "./SearchTable.module.css";

const COLUMNS: DataTableColumn[] = [
  { label: "Rutine" },
  { label: "Beste treff for", width: "150px" },
  { label: "Snittdekning", width: "160px" },
];

interface DocumentTableProps {
  results: DocumentResult[];
}

export function DocumentTable({ results }: DocumentTableProps) {
  return (
    <DataTable
      caption="Rutiner i Kvaliteket og henvendelsene de treffer"
      columns={COLUMNS}
      isEmpty={results.length === 0}
      emptyMessage="Ingen rutiner passer til søket."
    >
      {results.map(({ document, questionCount, meanCoverage }) => (
        <tr key={document.code}>
          <td>
            <div className={styles.strong}>{document.name}</div>
            <div className={styles.meta}>{document.uploadedLabel}</div>
          </td>
          <td className={styles.count}>{questionCount} {questionCount === 1 ? "henvendelse" : "henvendelser"}</td>
          <td>
            {meanCoverage === null ? (
              <span className={styles.soft}>Ingen treff</span>
            ) : (
              <CoverageMeter coverage={meanCoverage} />
            )}
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
