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
  canRun: boolean;
}

function describeRun(run: AnalysisRun): string {
  if (run.isRunning) return "Analysen tar noen minutter. Du kan bruke resten av dashbordet imens.";
  if (run.hasFinished) return "Ferdig. Listen er oppdatert.";
  if (run.hasFailed) return "Analysen feilet. Sjekk filene under «Importer data», og prøv igjen.";
  return "Bruker filene som sist ble lastet opp under «Importer data».";
}

export function RunAnalysisView({ snapshot, run, canRun }: RunAnalysisViewProps) {
  const runLabel = run.isRunning ? "Kjører …" : run.hasFinished || run.hasFailed ? "Kjør på nytt" : "Kjør analyse";

  return (
    <section className={styles.view}>
      <PageIntro
        title="Kjør analyse"
        lead="Sammenligner henvendelsene fra ServiceNow med rutinene i Kvaliteket og knytter hver henvendelse til rutinen den passer best til. Henvendelser som ikke passer til noen rutine havner under «Til gjennomgang»."
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

      {canRun ? (
        <div className={styles.runRow}>
          <Button variant="primary" onClick={run.start} disabled={run.isRunning}>
            {runLabel}
          </Button>
          <span className={styles.runHint} role={run.hasFailed ? "alert" : undefined}>
            {describeRun(run)}
          </span>
        </div>
      ) : (
        <p className={styles.runHint}>Bare administratorer kan kjøre en ny analyse.</p>
      )}

      {run.isRunning || run.hasFinished || run.hasFailed ? (
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
