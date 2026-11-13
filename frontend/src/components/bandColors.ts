/** Maps a band onto the token that colours it, so no component holds a hex value. */

import type { CoverageBand } from "../domain/priority";
import type { RoutineStatus } from "../domain/types";

export const COVERAGE_BAND_COLOR: Record<CoverageBand, string> = {
  weak: "var(--color-band-high)",
  partial: "var(--color-band-medium)",
  good: "var(--color-band-low)",
};

export const STATUS_COLOR: Record<RoutineStatus, string> = {
  unprocessed: "var(--color-accent)",
  "in-progress": "var(--color-band-medium)",
};
