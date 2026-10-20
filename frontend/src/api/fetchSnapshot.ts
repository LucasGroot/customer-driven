import type { AnalysisSnapshot } from "../domain/types";

/** The latest analysis run, as the backend serves it. Vite forwards /api to the backend in development. */
export async function fetchSnapshot(signal: AbortSignal): Promise<AnalysisSnapshot> {
  const response = await fetch("/api/snapshot", { signal });
  if (!response.ok) {
    throw new Error(`Backend svarte ${String(response.status)} på /api/snapshot.`);
  }
  return (await response.json()) as AnalysisSnapshot;
}
