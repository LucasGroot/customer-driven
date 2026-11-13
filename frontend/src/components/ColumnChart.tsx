import styles from "./ColumnChart.module.css";

interface Column {
  label: string;
  value: number;
  color: string;
}

interface ColumnChartProps {
  /** Read out by screen readers together with every column's value. */
  title: string;
  columns: Column[];
}

/** Columns scaled to the tallest one. Every value is printed on its column, so there is no y-axis. */
export function ColumnChart({ title, columns }: ColumnChartProps) {
  const largestValue = Math.max(1, ...columns.map((column) => column.value));
  const description = columns.map((column) => `${column.label}: ${String(column.value)}`).join(", ");

  return (
    <div className={styles.chart} role="img" aria-label={`${title}. ${description}`}>
      <div className={styles.plot}>
        {columns.map((column) => {
          const heightPercent = (column.value / largestValue) * 100;
          return (
            <div key={column.label} className={styles.slot}>
              <span className={styles.value} style={{ bottom: `${String(heightPercent)}%` }}>
                {column.value}
              </span>
              {column.value > 0 ? (
                <div className={styles.column} style={{ height: `${String(heightPercent)}%`, background: column.color }} />
              ) : null}
            </div>
          );
        })}
      </div>
      <div className={styles.categories}>
        {columns.map((column) => (
          <span key={column.label} className={styles.category}>
            {column.label}
          </span>
        ))}
      </div>
    </div>
  );
}
