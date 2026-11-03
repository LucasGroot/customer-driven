import type { ReactNode } from "react";
import styles from "./DataTable.module.css";
import type { SortState } from "./sort";

export interface DataTableColumn {
  label: string;
  /** Any CSS width; columns without one share the remaining space. */
  width?: string;
  align?: "left" | "right";
  /** Text shown in the info bubble next to the label. No bubble when omitted. */
  tooltip?: string;
  /** Makes the column sortable; passed back to `onSortChange` when the header is clicked. */
  sortKey?: string;
}

const DEFAULT_MIN_WIDTH = 560;

interface DataTableProps {
  /** Read by screen readers only. */
  caption: string;
  columns: DataTableColumn[];
  emptyMessage: string;
  isEmpty: boolean;
  /** Below this width in pixels the table scrolls sideways instead of squeezing its columns. */
  minWidth?: number;
  /** The column the rows are currently sorted by, if any. */
  sort?: SortState | null;
  onSortChange?: (sortKey: string) => void;
  /** The body rows. Cells pick up the shared padding and borders. */
  children: ReactNode;
}

function ariaSort(
  column: DataTableColumn,
  sort: SortState | null | undefined,
): "ascending" | "descending" | "none" | undefined {
  if (column.sortKey === undefined) return undefined;
  if (sort?.key !== column.sortKey) return "none";
  return sort.direction === "asc" ? "ascending" : "descending";
}

function sortArrow(column: DataTableColumn, sort: SortState | null | undefined): string {
  if (sort?.key !== column.sortKey) return "↕";
  return sort.direction === "asc" ? "▲" : "▼";
}

/** The bordered panel, header row and empty state every table in the dashboard shares. */
export function DataTable({
  caption,
  columns,
  emptyMessage,
  isEmpty,
  minWidth = DEFAULT_MIN_WIDTH,
  sort,
  onSortChange,
  children,
}: DataTableProps) {
  return (
    <div className={styles.panel}>
      <table className={styles.table} style={{ minWidth }}>
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
            {columns.map((column) => {
              const sortKey = column.sortKey;
              const sortable = sortKey !== undefined && onSortChange !== undefined;
              return (
                <th
                  key={column.label}
                  scope="col"
                  className={column.align === "right" ? styles.alignRight : undefined}
                  aria-sort={sortable ? ariaSort(column, sort) : undefined}
                >
                  <span className={styles.headerContent}>
                    {sortable ? (
                      <button
                        type="button"
                        className={styles.sortButton}
                        onClick={() => {
                          onSortChange(sortKey);
                        }}
                      >
                        {column.label}
                        <span
                          className={
                            sort?.key === sortKey
                              ? `${styles.sortArrow} ${styles.sortArrowActive}`
                              : styles.sortArrow
                          }
                          aria-hidden="true"
                        >
                          {sortArrow(column, sort)}
                        </span>
                      </button>
                    ) : (
                      column.label
                    )}
                    {column.tooltip !== undefined ? (
                      <span
                        className={styles.info}
                        tabIndex={0}
                        role="img"
                        aria-label={column.tooltip}
                        title={column.tooltip}
                      >
                        i
                      </span>
                    ) : null}
                  </span>
                </th>
              );
            })}
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
