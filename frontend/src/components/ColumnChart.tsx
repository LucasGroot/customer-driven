import styles from "./ColumnChart.module.css";

interface Column {
  label: string;
  value: number;
  color: string;
  onSelect: () => void;
}

interface ColumnChartProps {
  /** Names the group of columns for screen readers. */
  title: string;
  columns: Column[];
}

/**
 * Columns scaled to the tallest one. Every value is printed on its column, so there is no y-axis.
 * Each column and its label form one button.
 */
export function ColumnChart({ title, columns }: ColumnChartProps) {
  const largestValue = Math.max(1, ...columns.map((column) => column.value));

  return (
    <div className={styles.chart} role="group" aria-label={title}>
      {columns.map((column) => {
        const heightPercent = (column.value / largestValue) * 100;
        return (
          <button
            key={column.label}
            type="button"
            className={styles.columnButton}
            aria-label={`${column.label}: ${String(column.value)}`}
            onClick={column.onSelect}
          >
            <span className={styles.slot} aria-hidden="true">
              <span className={styles.value} style={{ bottom: `${String(heightPercent)}%` }}>
                {column.value}
              </span>
              {column.value > 0 ? (
                <span className={styles.column} style={{ height: `${String(heightPercent)}%`, background: column.color }} />
              ) : null}
            </span>
            <span className={styles.category} aria-hidden="true">
              {column.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
