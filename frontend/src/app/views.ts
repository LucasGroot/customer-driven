/** The screens in the dashboard, and the navigation entries that reach them. */

import type { CurrentUser } from "../auth/currentUser";

export type ViewName = "list" | "detail" | "review" | "run" | "summary" | "search" | "import" | "export";

interface NavigationEntry {
  view: Exclude<ViewName, "detail">;
  label: string;
  adminOnly?: boolean;
}

export const NAVIGATION: NavigationEntry[] = [
  { view: "list", label: "Prioritert liste" },
  { view: "review", label: "Til gjennomgang" },
  { view: "run", label: "Kjør analyse" },
  { view: "summary", label: "Oversikt" },
  { view: "search", label: "Søk og treff" },
  { view: "import", label: "Importer data", adminOnly: true },
  { view: "export", label: "Eksporter rapport", adminOnly: true },
];

/**
 * Hiding a page only keeps it out of the way; the API's require_admin is what
 * actually stops a non-admin from importing or exporting.
 */
export function navigationFor(role: CurrentUser["role"]): NavigationEntry[] {
  return NAVIGATION.filter((entry) => role === "admin" || entry.adminOnly !== true);
}

export function isAdminOnly(view: ViewName): boolean {
  return NAVIGATION.some((entry) => entry.view === view && entry.adminOnly === true);
}
