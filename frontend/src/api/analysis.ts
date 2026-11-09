export interface AnalysisStatus {
  status: "idle" | "running" | "done" | "error";
  completedSteps: number;
  error: string | null;
}

