/** The screens in the dashboard, and the navigation entries that reach them. */

export type ViewName = "list" | "detail" | "run" | "trend" | "search" | "export";

interface NavigationEntry {
  view: Exclude<ViewName, "detail" | "export">;
  label: string;
}

export const NAVIGATION: NavigationEntry[] = [
  { view: "list", label: "Prioritert liste" },
  { view: "run", label: "Kjør analyse" },
  { view: "trend", label: "Oversikt" },
  { view: "search", label: "Søk og treff" },
];

/** The gap detail and the export are opened from the list, so that entry stays highlighted. */
export function isNavigationActive(entry: NavigationEntry, current: ViewName): boolean {
  return (
    entry.view === current ||
    (entry.view === "list" && (current === "detail" || current === "export"))
  );
}

/** Who the prototype is shown as. Nothing is gated on it yet. */
export type ViewerRole = "user" | "admin";

export const VIEWER_ROLES: { role: ViewerRole; label: string }[] = [
  { role: "user", label: "Bruker" },
  { role: "admin", label: "Admin" },
];
