import type { QuestionId, ReviewDecision, RoutineCode } from "../domain/types";

export interface ReviewState {
  owners: Record<RoutineCode, string>;
  decisions: Record<QuestionId, ReviewDecision>;
}

// Adapte l'en-tête à ce que fait api/adminApi.ts
function headers(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
}

async function send(method: "PUT" | "POST", url: string, accessToken: string, body: unknown) {
  const response = await fetch(url, { method, headers: headers(accessToken), body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Backend svarte ${String(response.status)} på ${url}.`);
}

export async function fetchReview(accessToken: string, signal?: AbortSignal): Promise<ReviewState> {
  const response = await fetch("/api/review", { headers: headers(accessToken), ...(signal ? { signal } : {}) });
  if (!response.ok) throw new Error(`Backend svarte ${String(response.status)} på /api/review.`);
  return (await response.json()) as ReviewState;
}

/** owner = null puts the routine back to unprocessed. */
export function saveOwner(accessToken: string, routineCode: RoutineCode, owner: string | null) {
  return send("PUT", `/api/routines/${encodeURIComponent(routineCode)}/owner`, accessToken, { owner });
}

export function saveDecisions(accessToken: string, questionIds: QuestionId[], decision: ReviewDecision) {
  const routineCode = decision.kind === "mapped" ? decision.routineCode : undefined;
  return send("PUT", "/api/questions/decisions", accessToken, { questionIds, kind: decision.kind, routineCode });
}

export function saveUndo(accessToken: string, questionIds: QuestionId[]) {
  return send("POST", "/api/questions/decisions/undo", accessToken, { questionIds });
}
