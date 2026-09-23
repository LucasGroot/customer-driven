import { Button } from "../../components/Button";
import { classNames } from "../../components/classNames";
import { Card } from "../../components/Card";
import { PageIntro } from "../../components/PageIntro";
import { SliderRow } from "../../components/SliderRow";
import { THRESHOLD_RANGE, WEIGHT_RANGE, totalUnmatchedTickets } from "../../domain/priority";
import type { AnalysisSnapshot, PriorityWeights } from "../../domain/types";
import { RUN_STEPS, type AnalysisRun } from "../../hooks/useAnalysisRun";
import type { AnalysisSettings } from "../../hooks/useAnalysisSettings";
import styles from "./AnalysisSettingsView.module.css";

const WEIGHT_FIELDS: { key: keyof PriorityWeights; label: string }[] = [
  { key: "volume", label: "Hvor mange spør" },
  { key: "coverage", label: "Treff mot rutine" },
  { key: "trend", label: "Utvikling over tid" },
  { key: "age", label: "Dokumentets alder" },
];

function thresholdHint(thresholdPercent: number): string {
  if (thresholdPercent < 35) {
    return "Streng grense: bare de tydeligste hullene fanges. Noen reelle gap blir usynlige.";
  }
  if (thresholdPercent > 50) {
    return "Romslig grense: flere gap fanges, men flere henvendelser som faktisk hadde svar blir med.";
  }
  return "Anbefalt område. Bør kalibreres mot 50–100 henvendelser HR har vurdert manuelt.";
}

interface AnalysisSettingsViewProps {
  snapshot: AnalysisSnapshot;
  settings: AnalysisSettings;
  run: AnalysisRun;
}

export function AnalysisSettingsView({ snapshot, settings, run }: AnalysisSettingsViewProps) {
  const weightSum =
    settings.weights.volume +
      settings.weights.coverage +
      settings.weights.trend +
      settings.weights.age || 1;
  const unmatched = totalUnmatchedTickets(snapshot, settings.thresholdPercent);
  const unmatchedPercent = Math.round((unmatched / snapshot.totalTickets) * 100);

  const runLabel = run.isRunning ? "Kjører …" : run.hasFinished ? "Kjør på nytt" : "Kjør analysen nå";
  const runHint = run.isRunning
    ? "Tar omtrent to minutter."
    : run.hasFinished
      ? "Ferdig. Listen er oppdatert."
      : "Neste automatiske kjøring: 1. oktober 2026.";

  return (
    <section className={styles.view}>
      <PageIntro
        compact
        title="Analyseinnstillinger"
        lead="Her styrer du datakildene, hva som skal regnes som manglende treff, og hva som veier tyngst i prioriteringen."
      />

      <div className={styles.panel}>
        {snapshot.sources.map((source) => (
          <div key={source.name} className={styles.source}>
            <span className={styles.sourceDot} aria-hidden="true" />
            <div className={styles.sourceText}>
              <div className={styles.sourceName}>{source.name}</div>
              <div className={styles.sourceDetail}>{source.detail}</div>
            </div>
            <div className={styles.sourceCount}>{source.count}</div>
          </div>
        ))}

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
      </div>

      <Card title="Treffgrense">
        <p className={styles.lead}>
          Modellen gir hver henvendelse en treffscore mot det dokumentet som passer best. Ligger
          beste treff under grensen, regnes henvendelsen som uten svar i Kvaliteket.
        </p>
        <SliderRow
          label="Grense for «uten treff»"
          value={settings.thresholdPercent}
          min={THRESHOLD_RANGE.min}
          max={THRESHOLD_RANGE.max}
          step={THRESHOLD_RANGE.step}
          displayValue={`${String(settings.thresholdPercent)} %`}
          onChange={settings.setThresholdPercent}
        />
        <p className={styles.result} aria-live="polite">
          {unmatched} av {snapshot.totalTickets} henvendelser ({unmatchedPercent} %) regnes som
          uten svar i Kvaliteket. {thresholdHint(settings.thresholdPercent)}
        </p>
      </Card>

      <Card title="Vekting av prioritet">
        <p className={styles.lead}>
          Bestemmer hva som får høyest prioritet i arbeidslisten. Summen justeres automatisk til
          100 %.
        </p>
        {WEIGHT_FIELDS.map((field) => (
          <SliderRow
            key={field.key}
            label={field.label}
            value={settings.weights[field.key]}
            min={WEIGHT_RANGE.min}
            max={WEIGHT_RANGE.max}
            step={WEIGHT_RANGE.step}
            displayValue={`${String(Math.round((settings.weights[field.key] / weightSum) * 100))} %`}
            onChange={(value) => {
              settings.setWeight(field.key, value);
            }}
          />
        ))}
      </Card>
    </section>
  );
}
