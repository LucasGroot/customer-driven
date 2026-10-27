import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAnalysisStatus, startAnalysis } from "../api/analysis";

export const RUN_STEPS = [
  "Henter henvendelser fra ServiceNow",
  "Leser rutiner fra Kvaliteket",
  "Sammenligner henvendelser mot rutiner",
  "Finner henvendelser uten rutine",
  "Beregner prioritet",
] as const;

const POLL_MS = 1000;

export interface AnalysisRun {
  isRunning: boolean;
  hasFinished: boolean;
  hasFailed: boolean;
  completedSteps: number;
  start: () => void;
}

export function useAnalysisRun(): AnalysisRun {
  const [completedSteps, setCompletedSteps] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const pollRef = useRef<number | undefined>(undefined);

  const stopPolling = useCallback(() => {
    window.clearInterval(pollRef.current);
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const start = useCallback(() => {
    if (isRunning) return;
    setCompletedSteps(0);
    setHasFinished(false);
    setHasFailed(false);
    setIsRunning(true);

    startAnalysis()
      .then(() => {
        pollRef.current = window.setInterval(() => {
          fetchAnalysisStatus().then(
            (status) => {
              setCompletedSteps(status.completedSteps);
              if (status.status === "done") {
                stopPolling();
                setIsRunning(false);
                setHasFinished(true);
              } else if (status.status === "error") {
                stopPolling();
                setIsRunning(false);
                setHasFailed(true);
              }
            },
            () => {
              stopPolling();
              setIsRunning(false);
              setHasFailed(true);
            },
          );
        }, POLL_MS);
      })
      .catch(() => {
        setIsRunning(false);
        setHasFailed(true);
      });
  }, [isRunning, stopPolling]);

  return { isRunning, hasFinished, hasFailed, completedSteps, start };
}