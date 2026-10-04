/** The screens in the dashboard, and the navigation entries that reach them. */

export type ViewName = "list" | "detail" | "run" | "summary" | "search";

interface NavigationEntry {
  view: Exclude<ViewName, "detail">;
  label: string;
}

export const NAVIGATION: NavigationEntry[] = [
  { view: "list", label: "Prioritert liste" },
  { view: "run", label: "Kjør analyse" },
  { view: "summary", label: "Oversikt" },
  { view: "search", label: "Søk og treff" },
];
