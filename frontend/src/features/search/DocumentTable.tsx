import { CoverageMeter } from "../../components/CoverageMeter";
import type { DocumentResult } from "./searchResults";
import styles from "./SearchTable.module.css";

interface DocumentTableProps {
  results: DocumentResult[];
}

export function DocumentTable({ results }: DocumentTableProps) {
  return (
    <div className={styles.panel}>
      <table className={styles.table}>
        <caption className="visuallyHidden">Dokumenter i Kvaliteket og spørsmålene de treffer</caption>
        <colgroup>
          <col />
          <col className={styles.colCount} />
          <col className={styles.colCoverage} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Dokument</th>
            <th scope="col">Beste treff for</th>
            <th scope="col">Snittdekning</th>
          </tr>
        </thead>
        <tbody>
          {results.map(({ document, questionCount, meanCoverage }) => (
            <tr key={document.code}>
              <td>
                <div className={styles.strong}>{document.name}</div>
                <div className={styles.meta}>
                  {document.code} · revidert {document.revisedLabel}
                </div>
              </td>
              <td className={styles.count}>
                {questionCount} spørsmål
              </td>
              <td>
                {meanCoverage === null ? (
                  <span className={styles.soft}>Ingen treff</span>
                ) : (
                  <CoverageMeter coverage={meanCoverage} />
                )}
              </td>
            </tr>
          ))}
          {results.length === 0 ? (
            <tr>
              <td className={styles.empty} colSpan={3}>
                Ingen dokumenter passer til søket.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
