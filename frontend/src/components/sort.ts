/** Shared sorting state for tables. */

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string;
  direction: SortDirection;
}

/** First click on a column sorts ascending; clicking it again flips the direction. */
export function nextSort(current: SortState | null, key: string): SortState {
  if (current?.key === key) {
    return { key, direction: current.direction === "asc" ? "desc" : "asc" };
  }
  return { key, direction: "asc" };
}
