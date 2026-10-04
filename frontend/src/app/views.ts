/** The screens in the dashboard, and the navigation entries that reach them. */

export type ViewName = "list" | "detail" | "run" | "summary" | "search" | "export";

interface NavigationEntry {
  view: Exclude<ViewName, "detail" | "export">;
  label: string;
}

export const NAVIGATION: NavigationEntry[] = [
  { view: "list", label: "Prioritert liste" },
  { view: "run", label: "Kjør analyse" },
  { view: "summary", label: "Oversikt" },
  { view: "search", label: "Søk og treff" },
];

/** The export is opened from the list, so that entry stays highlighted. */
export function isNavigationActive(entry: NavigationEntry, current: ViewName): boolean {
  return entry.view === current || (entry.view === "list" && current === "export");
}
