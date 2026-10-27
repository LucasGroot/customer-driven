/** The screens in the dashboard, and the navigation entries that reach them. */

export type ViewName = "list" | "detail" | "review" | "run" | "summary" | "search" | "import";

interface NavigationEntry {
  view: Exclude<ViewName, "detail">;
  label: string;
}

export const NAVIGATION: NavigationEntry[] = [
  { view: "list", label: "Prioritert liste" },
  { view: "review", label: "Til gjennomgang" },
  { view: "run", label: "Kjør analyse" },
  { view: "summary", label: "Oversikt" },
  { view: "search", label: "Søk og treff" },
  { view: "import", label: "Importer data" },
];
