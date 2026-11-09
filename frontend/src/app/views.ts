/** The screens in the dashboard, and the navigation entries that reach them. */

import type { CurrentUser } from "../auth/currentUser";

export type ViewName = "list" | "detail" | "review" | "run" | "summary" | "search" | "import" | "about";

interface NavigationEntry {
  view: Exclude<ViewName, "detail">;
  label: string;
  adminOnly?: boolean;
}

export const NAVIGATION: NavigationEntry[] = [
  { view: "summary", label: "Oversikt" },
  { view: "list", label: "Prioritert liste" },
  { view: "review", label: "Henvendelser til manuell gjennomgang" },
  { view: "run", label: "Kjør analyse" },
  { view: "search", label: "Søk" },
  { view: "import", label: "Importer data", adminOnly: true },
  { view: "about", label: "Om analysen" },
];

/**
 * Hiding a page only keeps it out of the way; the API's require_admin is what
 * actually stops a non-admin from importing.
 */
export function navigationFor(role: CurrentUser["role"]): NavigationEntry[] {
  return NAVIGATION.filter((entry) => role === "admin" || entry.adminOnly !== true);
}

/** The page's name in the browser tab. The detail page uses the routine's name instead. */
export function pageLabel(view: ViewName): string {
  return NAVIGATION.find((entry) => entry.view === view)?.label ?? "Rutine";
}

export function isAdminOnly(view: ViewName): boolean {
  return NAVIGATION.some((entry) => entry.view === view && entry.adminOnly === true);
}
