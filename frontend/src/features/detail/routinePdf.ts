import type { RoutineDocument } from "../../domain/types";

/** Where the routine's PDF is served, or null when the routine has no file name. */
export function routinePdfUrl(routine: RoutineDocument): string | null {
  const name = routine.uploadedLabel.trim();
  if (name === "") return null;
  const file = name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;
  return `/pdf/${encodeURIComponent(file)}`;
}