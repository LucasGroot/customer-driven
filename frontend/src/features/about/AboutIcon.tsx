/** Small line icons for the "Om analysen" page, drawn after the Tabler icon set (MIT). */

export type AboutIconName =
  | "database"
  | "compare"
  | "checklist"
  | "chart"
  | "flag"
  | "search"
  | "chevron";

const PATHS: Record<AboutIconName, string[]> = {
  database: [
    "M4 6a8 3 0 1 0 16 0a8 3 0 1 0 -16 0",
    "M4 6v6a8 3 0 0 0 16 0v-6",
    "M4 12v6a8 3 0 0 0 16 0v-6",
  ],
  compare: [
    "M4 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
    "M16 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
    "M11 6h5a2 2 0 0 1 2 2v8",
    "M14 9l-3 -3l3 -3",
    "M13 18h-5a2 2 0 0 1 -2 -2v-8",
    "M10 15l3 3l-3 3",
  ],
  checklist: [
    "M3.5 5.5l1.5 1.5l2.5 -2.5",
    "M3.5 11.5l1.5 1.5l2.5 -2.5",
    "M3.5 17.5l1.5 1.5l2.5 -2.5",
    "M11 6h9",
    "M11 12h9",
    "M11 18h9",
  ],
  chart: [
    "M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z",
    "M9 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z",
    "M15 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z",
    "M4 20h14",
  ],
  flag: [
    "M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9z",
    "M5 21v-7",
  ],
  search: ["M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0", "M21 21l-6 -6"],
  chevron: ["M6 9l6 6l6 -6"],
};

interface AboutIconProps {
  name: AboutIconName;
  className?: string | undefined;
}

export function AboutIcon({ name, className }: AboutIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
