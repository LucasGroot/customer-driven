import { Card } from "../../components/Card";
import { PageIntro } from "../../components/PageIntro";
import type { AnalysisSnapshot } from "../../domain/types";
import { MonthlyUnmatchedChart } from "./MonthlyUnmatchedChart";
import styles from "./TrendsView.module.css";
import { classNames } from "../../components/classNames";

interface TrendsViewProps {
  snapshot: AnalysisSnapshot;
}

export function TrendsView({ snapshot }: TrendsViewProps) {
  const months = snapshot.monthlyUnmatched;
  const newest = months.at(-1);
  const previous = months.at(-2);
  const deltaNote =
    newest === undefined || previous === undefined
      ? ""
      : `${String(newest.percent)} % i ${newest.month}, ${
          newest.percent <= previous.percent ? "ned" : "opp"
        } fra ${String(previous.percent)} % i ${previous.month}`;

  return (
    <section className={styles.view}>
      <PageIntro
        compact
        title="Utvikling over tid"
        lead="Andelen henvendelser som ikke finner et godt svar i Kvaliteket. Faller kurven etter at en rutine er oppdatert, virket oppdateringen."
      />

      <div className={styles.chartPanel}>
        <MonthlyUnmatchedChart months={months} deltaNote={deltaNote} />
      </div>

      <div className={styles.columns}>
        <Card title="Størst økning denne måneden">
          {snapshot.risingTopics.map((entry) => (
            <div key={entry.topic} className={styles.row}>
              <span className={styles.topic}>{entry.topic}</span>
              <span className={classNames(styles.delta, styles.rising)}>{entry.delta}</span>
            </div>
          ))}
        </Card>

        <Card title="Effekt av oppdaterte rutiner">
          {snapshot.resolvedTopics.map((entry) => (
            <div key={entry.topic} className={styles.resolvedRow}>
              <div className={styles.resolvedHead}>
                <span className={styles.topic}>{entry.topic}</span>
                <span className={classNames(styles.delta, styles.resolved)}>{entry.delta}</span>
              </div>
              {entry.note === undefined ? null : (
                <span className={styles.note}>{entry.note}</span>
              )}
            </div>
          ))}
        </Card>
      </div>
    </section>
  );
}
