/// <reference types="node" />
/**
 * Reads the stylesheets from disk for the tests that check them, since Vitest
 * hands CSS imports to a test as empty strings.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const srcFolder = join(import.meta.dirname, "..");

/** Every stylesheet under src/ with its path inside src/, e.g. "components/Button.module.css". */
export function readStylesheets(): { path: string; css: string }[] {
  return readdirSync(srcFolder, { recursive: true, encoding: "utf8" })
    .filter((path) => path.endsWith(".css"))
    .map((path) => ({ path: path.replaceAll("\\", "/"), css: readFileSync(join(srcFolder, path), "utf8") }));
}

/** The rules of a stylesheet as selector and body, including those inside @media. */
export function readRules(css: string): { selector: string; body: string }[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...withoutComments.matchAll(/([^{};]+)\{([^{}]*)\}/g)].flatMap((match) => {
    const [, selector, body] = match;
    return selector === undefined || body === undefined ? [] : [{ selector: selector.trim(), body }];
  });
}
