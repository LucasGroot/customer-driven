/// <reference types="node" />
/**
 * What the page itself promises before any component is drawn: its language,
 * its title, that it can be zoomed, the focus ring and reduced motion. The
 * component tests run in jsdom, which loads none of this, so it is read from disk.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readRules, readStylesheets } from "../styles/cssFiles";

const indexHtml = readFileSync(join(import.meta.dirname, "../../index.html"), "utf8");
const stylesheets = readStylesheets();
const globalCss = stylesheets.find((sheet) => sheet.path === "styles/global.css")?.css ?? "";

describe("index.html", () => {
  it("states the page language as Norwegian (WCAG 3.1.1)", () => {
    expect(indexHtml).toMatch(/<html[^>]*\slang="nb"/);
  });

  it("gives the page a title (WCAG 2.4.2)", () => {
    const title = /<title>([^<]*)<\/title>/.exec(indexHtml)?.[1] ?? "";
    expect(title.trim()).not.toBe("");
  });

  it("does not stop the user from zooming (WCAG 1.4.4)", () => {
    const viewport = /<meta[^>]*name="viewport"[^>]*>/.exec(indexHtml)?.[0] ?? "";
    expect(viewport).not.toBe("");
    expect(viewport).not.toMatch(/user-scalable\s*=\s*(no|0)/);
    expect(viewport).not.toMatch(/maximum-scale/);
  });
});

describe("global.css", () => {
  it("draws the shared focus ring on every element reached by keyboard (WCAG 2.4.7)", () => {
    const ring = readRules(globalCss).find((rule) => rule.selector === ":focus-visible");
    expect(ring?.body).toMatch(/outline:\s*var\(--focus-ring\)/);
  });

  it("turns animation off for users who ask for less motion (WCAG 2.3.3)", () => {
    expect(globalCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });
});

describe("the focus ring is never removed", () => {
  // Only for elements that receive focus from code and are not something to click:
  // the page headings and the main area (see global.css) and the open information bubble.
  const FOCUSED_BY_CODE = ['[tabindex="-1"]:focus', ".bubble:focus"];

  const removals = stylesheets.flatMap((sheet) =>
    readRules(sheet.css)
      .filter((rule) => /outline(-style)?:\s*(none|0)\b/.test(rule.body))
      .map((rule) => ({ where: `${sheet.path}: ${rule.selector}`, selector: rule.selector })),
  );

  it("finds the removals this test knows about", () => {
    expect(removals.length).toBeGreaterThan(0);
  });

  it.each(removals.map((removal) => [removal.where, removal.selector]))("%s", (_where, selector) => {
    expect(FOCUSED_BY_CODE).toContain(selector);
  });
});
