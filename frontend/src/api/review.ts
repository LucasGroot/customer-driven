import type { QuestionId, ReviewDecision, RoutineCode, RoutineStatus } from "../domain/types";

export interface ReviewState {
  statuses: Record<RoutineCode, RoutineStatus>;
  owners: Record<RoutineCode, string>;
  decisions: Record<QuestionId, ReviewDecision>;
}

async function send(method: "PUT" | "POST", url: string, body: unknown): Promise<void> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Backend svarte ${String(response.status)} på ${url}.`);
  }
}

export async function fetchReview(signal: AbortSignal): Promise<ReviewState> {
  const response = await fetch("/api/review", { signal });
  if (!response.ok) {
    throw new Error(`Backend svarte ${String(response.status)} på /api/review.`);
  }
  return (await response.json()) as ReviewState;
}

export function saveStatus(routineCode: RoutineCode, status: RoutineStatus) {
  return send("PUT", `/api/routines/${encodeURIComponent(routineCode)}/status`, { status });
}

export function saveOwner(routineCode: RoutineCode, owner: string) {
  return send("PUT", `/api/routines/${encodeURIComponent(routineCode)}/owner`, { owner });
}

export function saveDecisions(questionIds: QuestionId[], decision: ReviewDecision) {
  const routineCode = decision.kind === "mapped" ? decision.routineCode : undefined;
  return send("PUT", "/api/questions/decisions", {
    questionIds,
    kind: decision.kind,
    routineCode,
  });
}

export function undoDecisions(questionIds: QuestionId[]) {
  return send("POST", "/api/questions/decisions/undo", { questionIds });
}