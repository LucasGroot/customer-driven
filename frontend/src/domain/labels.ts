/**
 * Norwegian wording for the values the domain produces. The interface language
 * is Norwegian because the users are HR staff at Trondheim kommune; the code
 * around it stays in English.
 */

import type { CoverageBand, PriorityBand } from "./priority";
import type { GapStatus } from "./types";

export const PRIORITY_BAND_LABEL: Record<PriorityBand, string> = {
  high: "Høy prioritet",
  medium: "Middels prioritet",
  low: "Lav prioritet",
};

const COVERAGE_BAND_LABEL: Record<CoverageBand, string> = {
  weak: "Svak",
  partial: "Delvis",
  good: "God",
};

export const STATUS_LABEL: Record<GapStatus, string> = {
  new: "Ny",
  updating: "Under oppdatering",
  done: "Behandlet",
};

export const STATUS_OPTIONS: GapStatus[] = ["new", "updating", "done"];

export function formatPercent(fraction: number): string {
  return `${String(Math.round(fraction * 100))} %`;
}

export function formatCoverage(coverage: number, band: CoverageBand): string {
  return `${COVERAGE_BAND_LABEL[band]} · ${formatPercent(coverage)}`;
}

/** Plain wording for a trend, used where the priority score is explained. */
export function describeTrend(trendPercent: number): string {
  if (trendPercent > 0) return `Økt ${String(trendPercent)} prosent siden forrige måned`;
  if (trendPercent < 0)
    return `Falt ${String(Math.abs(trendPercent))} prosent siden forrige måned`;
  return "Uendret fra forrige måned";
}

export function formatSavedAt(date: Date): string {
  return `Lagret ${date.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}`;
}
