/** Fetches the analysis once when the dashboard opens and says where the fetch stands. */

import { useEffect, useState } from "react";
import { fetchSnapshot } from "../api/fetchSnapshot";
import type { AnalysisSnapshot } from "../domain/types";

export type SnapshotState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; snapshot: AnalysisSnapshot };

export function useSnapshot(accessToken: string): SnapshotState {
  const [state, setState] = useState<SnapshotState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetchSnapshot(accessToken, controller.signal).then(
      (snapshot) => {
        setState({ status: "ready", snapshot });
      },
      () => {
        // StrictMode aborts the first fetch on purpose; that is not an error to show.
        if (!controller.signal.aborted) setState({ status: "error" });
      },
    );
    return () => {
      controller.abort();
    };
  }, [accessToken]);

  return state;
}