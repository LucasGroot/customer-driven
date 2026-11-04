/** The questions on the "Om analysen" page that other pages can link to. */
export const ABOUT_TOPICS = [
  "coverage",
  "bands",
  "ranking",
  "status",
  "suggested-routine",
  "manual-review",
  "knowledge-gaps",
  "data",
  "rerun",
  "interpretation",
] as const;

export type AboutTopic = (typeof ABOUT_TOPICS)[number];
