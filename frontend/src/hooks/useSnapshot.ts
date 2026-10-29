/**
 * Fetches the analysis when the dashboard opens, and again whenever version
 * changes because a new run has replaced it. Says where the fetch stands.
 */

import { useEffect, useState } from "react";
import { fetchSnapshot } from "../api/fetchSnapshot";
import type { AnalysisSnapshot } from "../domain/types";

export type SnapshotState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; snapshot: AnalysisSnapshot };

export function useSnapshot(accessToken: string, version: number): SnapshotState {
  const [state, setState] = useState<SnapshotState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetchSnapshot(accessToken, controller.signal).then(
      (snapshot) => {
        setState({ status: "ready", snapshot });
      },
      () => {
        // StrictMode aborts the first fetch on purpose; that is not an error to show.
        if (controller.signal.aborted) return;
        // A failed refresh keeps the analysis already shown instead of replacing the dashboard.
        setState((current) => (current.status === "ready" ? current : { status: "error" }));
      },
    );
    return () => {
      controller.abort();
    };
  }, [accessToken, version]);

  return state;
}
