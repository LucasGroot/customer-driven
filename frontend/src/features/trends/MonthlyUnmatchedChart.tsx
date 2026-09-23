import type { MonthlyUnmatched } from "../../domain/types";
import styles from "./MonthlyUnmatchedChart.module.css";
import { classNames } from "../../components/classNames";

interface MonthlyUnmatchedChartProps {
  months: MonthlyUnmatched[];
  deltaNote: string;
}

/**
 * One series over time, so the title names it and no legend is needed. The
 * newest month carries the accent colour; the rest stay recessive.
 */
export function MonthlyUnmatchedChart({ months, deltaNote }: MonthlyUnmatchedChartProps) {
  // A fixed ceiling rather than the series maximum, so the bars stay comparable
  // between runs instead of rescaling whenever the worst month changes.
  const scaleCeiling = 50;
  const newestMonth = months.at(-1)?.month;

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.caption}>
        <h2 className={styles.title}>Udekkede henvendelser per måned</h2>
        <span className={styles.delta}>{deltaNote}</span>
      </figcaption>

      <div className={styles.plot} role="presentation">
        {months.map((entry) => {
          const isCurrent = entry.month === newestMonth;
          return (
            <div key={entry.month} className={styles.column}>
              <span className={styles.value}>{entry.percent} %</span>
              <div
                className={isCurrent ? classNames(styles.bar, styles.current) : styles.bar}
                style={{ height: `${String((entry.percent / scaleCeiling) * 100)}%` }}
                title={`${entry.month}: ${String(entry.percent)} % udekket`}
              />
              <span className={styles.month}>{entry.month}</span>
            </div>
          );
        })}
      </div>

      <table className="visuallyHidden">
        <caption>Andel udekkede henvendelser per måned</caption>
        <thead>
          <tr>
            <th scope="col">Måned</th>
            <th scope="col">Andel udekket</th>
          </tr>
        </thead>
        <tbody>
          {months.map((entry) => (
            <tr key={entry.month}>
              <th scope="row">{entry.month}</th>
              <td>{entry.percent} %</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
