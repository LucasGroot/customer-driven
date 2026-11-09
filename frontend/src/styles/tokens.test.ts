/// <reference types="node" />
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Read from disk, since Vitest hands CSS imports to the test as empty strings
const tokensCss = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

/** Every custom property in tokens.css, with var() references followed to a hex value. */
function readColors(css: string): Map<string, string> {
  const raw = new Map<string, string>();
  for (const match of css.matchAll(/(--color-[\w-]+):\s*([^;]+);/g)) {
    const [, name, value] = match;
    if (name !== undefined && value !== undefined) raw.set(name, value.trim());
  }
  const resolve = (value: string): string => {
    const reference = /^var\((--[\w-]+)\)$/.exec(value)?.[1];
    if (reference === undefined) return value;
    const target = raw.get(reference);
    if (target === undefined) throw new Error(`${reference} is not defined in tokens.css`);
    return resolve(target);
  };
  return new Map([...raw].map(([name, value]) => [name, resolve(value)]));
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The WCAG contrast ratio, from 1 (none) to 21 (black on white). */
function contrast(first: string, second: string): number {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}

const colors = readColors(tokensCss);

function color(name: string): string {
  const value = colors.get(name);
  if (value === undefined) throw new Error(`${name} is not defined in tokens.css`);
  return value;
}

// Every background that text sits on, including the light blue menu
const BACKGROUNDS = [
  "--color-canvas",
  "--color-surface",
  "--color-surface-muted",
  "--color-surface-quote",
  "--color-blue-100",
  "--color-accent-surface",
  "--color-track",
];

const TEXT_COLORS = [
  "--color-text",
  "--color-text-strong",
  "--color-text-body",
  "--color-text-muted",
  "--color-text-subtle",
  "--color-text-soft",
  "--color-text-faint",
  "--color-text-dim",
  "--color-accent",
  "--color-band-high",
  "--color-band-medium",
  "--color-band-low",
];

const BADGES = ["accent", "warning", "success", "neutral"];

// The edges that show where a field or button is
const EDGES = ["--color-border-input", "--color-accent-border", "--color-danger-border"];

describe("colour contrast (WCAG 2.1 AA)", () => {
  it.each(TEXT_COLORS.flatMap((text) => BACKGROUNDS.map((background) => [text, background])))(
    "%s is readable on %s",
    (text, background) => {
      expect(contrast(color(text), color(background))).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(BADGES)("the %s badge is readable", (tone) => {
    const ratio = contrast(color(`--color-badge-${tone}-fg`), color(`--color-badge-${tone}-bg`));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("white text is readable on primary buttons and selected filters", () => {
    expect(contrast(color("--color-surface"), color("--color-accent"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(color("--color-surface"), color("--color-accent-hover"))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(EDGES.flatMap((edge) => ["--color-canvas", "--color-surface"].map((background) => [edge, background])))(
    "%s stands out from %s",
    (edge, background) => {
      expect(contrast(color(edge), color(background))).toBeGreaterThanOrEqual(3);
    },
  );

  it.each(BACKGROUNDS)("the focus ring stands out from %s", (background) => {
    expect(contrast(color("--color-accent"), color(background))).toBeGreaterThanOrEqual(3);
  });
});
