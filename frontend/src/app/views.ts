/** The screens in the dashboard, and the navigation entries that reach them. */

export type ViewName = "list" | "detail" | "review" | "run" | "summary" | "search";

interface NavigationEntry {
  view: Exclude<ViewName, "detail">;
  label: string;
}

export const NAVIGATION: NavigationEntry[] = [
  { view: "summary", label: "Oversikt" },
  { view: "list", label: "Prioritert liste" },
  { view: "review", label: "Uklassifiserte henvendeler til manuell gjennomgang" },
  { view: "run", label: "Kjør analyse" },
  { view: "search", label: "Søk" },
];
