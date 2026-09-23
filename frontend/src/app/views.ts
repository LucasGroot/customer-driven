/** The screens in the dashboard, and the navigation entries that reach them. */

export type ViewName = "list" | "detail" | "trend" | "run" | "export";

interface NavigationEntry {
  view: Exclude<ViewName, "detail">;
  label: string;
}

export const NAVIGATION: NavigationEntry[] = [
  { view: "list", label: "Oversikt" },
  { view: "trend", label: "Trender" },
  { view: "run", label: "Analyseinnstillinger" },
  { view: "export", label: "Eksporter" },
];

/** The gap detail lives under Oversikt, so that entry stays highlighted. */
export function isNavigationActive(entry: NavigationEntry, current: ViewName): boolean {
  return entry.view === current || (entry.view === "list" && current === "detail");
}
