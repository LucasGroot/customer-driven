/** Maps a band onto the token that colours it, so no component holds a hex value. */

import type { CoverageBand, PriorityBand } from "../domain/priority";

export const PRIORITY_BAND_COLOR: Record<PriorityBand, string> = {
  high: "var(--color-band-high)",
  medium: "var(--color-band-medium)",
  low: "var(--color-band-low)",
};

export const COVERAGE_BAND_COLOR: Record<CoverageBand, string> = {
  weak: "var(--color-band-high)",
  partial: "var(--color-band-medium)",
  good: "var(--color-band-low)",
};

export function trendColor(trendPercent: number): string {
  if (trendPercent > 15) return "var(--color-band-high)";
  if (trendPercent < 0) return "var(--color-band-low)";
  return "var(--color-text-faint)";
}
