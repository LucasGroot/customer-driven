export interface AnalysisStatus {
  status: "idle" | "running" | "done" | "error";
  completedSteps: number;
  error: string | null;
}

export async function startAnalysis(): Promise<void> {
  const response = await fetch("/api/analysis/run", { method: "POST" });
  if (!response.ok && response.status !== 409) {
    throw new Error(`Backend svarte ${String(response.status)} på /api/analysis/run.`);
  }
}

export async function fetchAnalysisStatus(): Promise<AnalysisStatus> {
  const response = await fetch("/api/analysis/status");
  if (!response.ok) {
    throw new Error(`Backend svarte ${String(response.status)} på /api/analysis/status.`);
  }
  return (await response.json()) as AnalysisStatus;
}