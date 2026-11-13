import { describe, expect, it } from "vitest";
import { readRules, readStylesheets } from "./cssFiles";

/**
 * WCAG 1.4.10 asks for a page that fits a 320 px wide window (400 % zoom on a
 * 1280 px screen) without scrolling sideways. jsdom draws no layout, so this
 * cannot be measured here; it guards the usual cause instead: a grid whose
 * columns refuse to be narrower than the screen. It is a guard, not a
 * measurement. Layouts built any other way are checked by hand at 320 px.
 *
 * On a 320 px screen the main area is 291 px wide (the page is scaled to 110 %),
 * and the widest grid inside a card measured 251 px.
 */
const WIDEST_GRID_PX = 251;

interface Grid {
  where: string;
  /** What the columns and the gaps between them need at least, in px. */
  neededPx: number;
}

/** Splits "minmax(130px, 1fr) 32px" at the spaces outside brackets. */
function tracksOf(columns: string): string[] {
  const tracks: string[] = [];
  let depth = 0;
  let current = "";
  for (const character of columns) {
    if (character === "(") depth++;
    if (character === ")") depth--;
    if (character === " " && depth === 0) {
      if (current !== "") tracks.push(current);
      current = "";
    } else {
      current += character;
    }
  }
  if (current !== "") tracks.push(current);
  return tracks;
}

/** The smallest a track can be: a fixed width, or the first value of minmax(). */
function minimumOf(track: string): number {
  // min(300px, 100%) can shrink to the screen, which is the point of writing it that way
  if (/^minmax\(\s*min\(/.test(track)) return 0;
  const pixels = /^(?:minmax\(\s*)?([\d.]+)px/.exec(track)?.[1];
  return pixels === undefined ? 0 : Number(pixels);
}

function columnGapOf(body: string): number {
  const gap = /(?:^|[\s;])(?:column-)?gap:\s*([^;]+)/.exec(body)?.[1] ?? "";
  const pixels = [...gap.matchAll(/([\d.]+)px/g)].map((match) => Number(match[1]));
  return pixels.at(-1) ?? 0;
}

const grids: Grid[] = [];
const selectorsWithAnotherLayout = new Set<string>();

for (const sheet of readStylesheets()) {
  const seen = new Set<string>();
  for (const rule of readRules(sheet.css)) {
    const columns = /grid-template-columns:\s*([^;]+)/.exec(rule.body)?.[1];
    if (columns === undefined) continue;
    // repeat(auto-fit, minmax(...)) wraps to fewer columns, so it only needs one column to fit
    const repeated = /^repeat\(\s*auto-(?:fit|fill)\s*,\s*(.+)\)$/.exec(columns.trim())?.[1];
    const tracks = repeated === undefined ? tracksOf(columns.trim()) : [repeated.trim()];
    const neededPx =
      tracks.reduce((sum, track) => sum + minimumOf(track), 0) + columnGapOf(rule.body) * (tracks.length - 1);
    // ".question, .clusterSummary { ... }" lays out two elements at once
    for (const selector of rule.selector.split(",").map((part) => part.trim())) {
      const key = `${sheet.path}: ${selector}`;
      // A second layout for the same selector is the one for narrow screens
      if (seen.has(selector)) selectorsWithAnotherLayout.add(key);
      seen.add(selector);
      grids.push({ where: key, neededPx });
    }
  }
}

/**
 * The layout that applies on a narrow screen: the last rule for each selector.
 * The stylesheets only use max-width queries, written after the rule they change.
 */
const narrowScreenGrids = [...new Map(grids.map((grid) => [grid.where, grid])).values()];

describe("grids on a 320 px screen (WCAG 1.4.10)", () => {
  it("finds the grids this test knows about", () => {
    expect(narrowScreenGrids.length).toBeGreaterThan(0);
    expect(selectorsWithAnotherLayout.size).toBeGreaterThan(0);
  });

  it.each(narrowScreenGrids.map((grid) => [grid.where, grid.neededPx] as const))(
    "%s needs %s px at most",
    (_where, neededPx) => {
      expect(neededPx).toBeLessThanOrEqual(WIDEST_GRID_PX);
    },
  );
});
