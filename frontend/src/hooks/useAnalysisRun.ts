/**
 * Starts an analysis run on the backend and follows it until it is done, so
 * the run page can tick off each step as the backend finishes it. Only
 * administrators can run one; for everyone else the hook stays idle.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAnalysisStatus, startAnalysis, type AnalysisStatus } from "../api/adminApi";

/** The backend reports progress against these five steps (ANALYSIS_STEP_COUNT in analysis_run.py). */
export const RUN_STEPS = [
  "Henter henvendelser fra ServiceNow",
  "Leser rutiner fra Kvaliteket",
  "Sammenligner henvendelser mot rutiner",
  "Finner henvendelser uten rutine",
  "Beregner prioritet",
] as const;

const POLL_INTERVAL_MS = 2000;

export interface AnalysisRun {
  isRunning: boolean;
  /** A run followed on this page finished. A run from before the page opened does not count. */
  hasFinished: boolean;
  hasFailed: boolean;
  completedSteps: number;
  start: () => void;
}

export function useAnalysisRun(accessToken: string, canRun: boolean, onFinished: () => void): AnalysisRun {
  const [status, setStatus] = useState<AnalysisStatus>({ state: "idle", completedSteps: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const onFinishedRef = useRef(onFinished);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  });

  // Picks up a run that is already going, for example one started in another tab.
  useEffect(() => {
    if (!canRun) return;
    const controller = new AbortController();
    fetchAnalysisStatus(accessToken, controller.signal).then(
      (current) => {
        setStatus(current);
        if (current.state === "running") setIsFollowing(true);
      },
      () => undefined,
    );
    return () => {
      controller.abort();
    };
  }, [accessToken, canRun]);

  useEffect(() => {
    if (!isFollowing || status.state !== "running") return;
    const timer = window.setTimeout(() => {
      fetchAnalysisStatus(accessToken).then(
        (next) => {
          setStatus(next);
          if (next.state === "finished") onFinishedRef.current();
        },
        // A copy of the same status schedules the next attempt, so a dropped request is retried.
        () => {
          setStatus((current) => ({ ...current }));
        },
      );
    }, POLL_INTERVAL_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [accessToken, isFollowing, status]);

  const start = useCallback(() => {
    if (!canRun || status.state === "running") return;
    setIsFollowing(true);
    setStatus({ state: "running", completedSteps: 0 });
    startAnalysis(accessToken).catch(() => {
      setStatus((current) => ({ ...current, state: "failed" }));
    });
  }, [accessToken, canRun, status.state]);

  return {
    isRunning: status.state === "running",
    hasFinished: isFollowing && status.state === "finished",
    hasFailed: isFollowing && status.state === "failed",
    completedSteps: status.completedSteps,
    start,
  };
}
