import type { ReactNode } from "react";
import styles from "./DataTable.module.css";

export interface DataTableColumn {
  label: string;
  /** Any CSS width; columns without one share the remaining space. */
  width?: string;
  align?: "left" | "right";
}

interface DataTableProps {
  /** Read by screen readers only. */
  caption: string;
  columns: DataTableColumn[];
  emptyMessage: string;
  isEmpty: boolean;
  /** The body rows. Cells pick up the shared padding and borders. */
  children: ReactNode;
}

/** The bordered panel, header row and empty state every table in the dashboard shares. */
export function DataTable({ caption, columns, emptyMessage, isEmpty, children }: DataTableProps) {
  return (
    <div className={styles.panel}>
      <table className={styles.table}>
        <caption className="visuallyHidden">{caption}</caption>
        <colgroup>
          {columns.map((column) => (
            <col
              key={column.label}
              style={column.width === undefined ? undefined : { width: column.width }}
            />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.label}
                scope="col"
                className={column.align === "right" ? styles.alignRight : undefined}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
          {isEmpty ? (
            <tr>
              <td className={styles.empty} colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
