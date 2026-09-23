/**
 * Drives the step-by-step progress shown while an analysis run is simulated.
 * The real run belongs on the backend; this only animates the stages so the
 * screen can be reviewed with the customer.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export const RUN_STEPS = [
  "Henter henvendelser fra ServiceNow",
  "Leser dokumenter fra Kvaliteket",
  "Grupperer henvendelser i temaer",
  "Sammenligner temaer mot dokumenter",
  "Beregner prioritet",
] as const;

const STEP_DURATION_MS = 550;

export interface AnalysisRun {
  isRunning: boolean;
  hasFinished: boolean;
  completedSteps: number;
  start: () => void;
}

export function useAnalysisRun(): AnalysisRun {
  const [completedSteps, setCompletedSteps] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!isRunning) return;
    if (completedSteps >= RUN_STEPS.length) {
      setIsRunning(false);
      setHasFinished(true);
      return;
    }
    timerRef.current = window.setTimeout(() => {
      setCompletedSteps((step) => step + 1);
    }, STEP_DURATION_MS);
  }, [isRunning, completedSteps]);

  const start = useCallback(() => {
    if (isRunning) return;
    setCompletedSteps(0);
    setHasFinished(false);
    setIsRunning(true);
  }, [isRunning]);

  return { isRunning, hasFinished, completedSteps, start };
}
