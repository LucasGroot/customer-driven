import { Button } from "../../components/Button";
import { classNames } from "../../components/classNames";
import { Card } from "../../components/Card";
import { PageIntro } from "../../components/PageIntro";
import type { AnalysisSnapshot } from "../../domain/types";
import { RUN_STEPS, type AnalysisRun } from "../../hooks/useAnalysisRun";
import styles from "./RunAnalysisView.module.css";

interface RunAnalysisViewProps {
  snapshot: AnalysisSnapshot;
  run: AnalysisRun;
}

export function RunAnalysisView({ snapshot, run }: RunAnalysisViewProps) {
  const runLabel = run.isRunning ? "Kjører …" : run.hasFinished ? "Kjør på nytt" : "Kjør analyse";
  const runHint = run.hasFinished
    ? "Ferdig. Listen er oppdatert."
    : "Simulert kjøring i prototypen";

  return (
    <section className={styles.view}>
      <PageIntro
        title="Kjør analyse"
        lead="Sammenligner henvendelsene fra ServiceNow med rutinene i Kvaliteket og grupperer dem i temaer. Resultatet havner i den prioriterte listen."
      />

      <Card title="Datagrunnlag">
        <div>
          {snapshot.sources.map((source) => (
            <div key={source.name} className={styles.source}>
              <span className={styles.sourceName}>{source.name}</span>
              <span className={styles.sourceDetail}>
                {source.count} {source.unit} · lastet opp {source.uploadedLabel}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className={styles.runRow}>
        <Button variant="primary" onClick={run.start} disabled={run.isRunning}>
          {runLabel}
        </Button>
        <span className={styles.runHint}>{runHint}</span>
      </div>

      {run.isRunning || run.hasFinished ? (
        <ol className={styles.progress} aria-live="polite">
          {RUN_STEPS.map((label, index) => {
            const done = run.completedSteps > index;
            const active = run.completedSteps === index && run.isRunning;
            return (
              <li
                key={label}
                className={classNames(
                  styles.step,
                  done && styles.stepDone,
                  active && styles.stepActive,
                )}
              >
                <span className={styles.stepMark} aria-hidden="true">
                  {done ? "✓" : active ? "·" : ""}
                </span>
                <span>{label}</span>
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}
