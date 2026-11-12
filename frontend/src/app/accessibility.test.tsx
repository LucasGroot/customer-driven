// @vitest-environment jsdom
/// <reference types="node" />
/**
 * Opens every page of the dashboard on the bundled sample of invented data and
 * checks it with axe against WCAG 2.1 AA. Contrast is left out here, as jsdom
 * draws nothing to measure; tokens.test.ts checks the colours instead.
 */

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "../auth/currentUser";
import { App } from "./App";

// The same sample the API serves when there is no real analysis. Read from disk,
// since Vite refuses imports from outside frontend/, which keeps data/ out of reach.
const samplePath = join(import.meta.dirname, "../../../src/backend/snapshot/sample_snapshot.json");
const sampleSnapshot: unknown = JSON.parse(readFileSync(samplePath, "utf8"));

const ADMIN: CurrentUser = { name: "Test Testesen", email: "test@example.com", role: "admin" };

async function violations(): Promise<string[]> {
  const results = await axe.run(document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map(
    (violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target.join(" ")).join(", ")})`,
  );
}

async function openDashboard() {
  render(<App user={ADMIN} accessToken="token" onSignOut={() => {}} />);
  await screen.findByRole("heading", { level: 1, name: "Rutiner som bør oppdateres først" });
}

function openPage(label: string) {
  const menu = screen.getByRole("navigation", { name: "Hovedmeny" });
  // The menu entries with a count carry it in their name, so match the start only
  fireEvent.click(within(menu).getByRole("button", { name: new RegExp(`^${label}`) }));
}

beforeEach(() => {
  // As in index.html, which the test page does not load
  document.documentElement.lang = "nb";
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(
        url === "/api/snapshot"
          ? Response.json(sampleSnapshot)
          : Response.json({ state: "idle", completedSteps: 0 }),
      ),
    ),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("every page meets WCAG 2.1 AA", () => {
  it.each([
    ["Oversikt", "Oversikt"],
    ["Prioriterte rutiner", "Rutiner som bør oppdateres først"],
    ["Henvendelser til manuell gjennomgang", "Henvendelser til manuell gjennomgang"],
    ["Kjør analyse", "Kjør analyse"],
    ["Søk", "Søk"],
    ["Importer data", "Last opp data"],
    ["Om analysen", "Om analysen"],
  ])("%s", async (menuLabel, heading) => {
    await openDashboard();
    openPage(menuLabel);

    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeDefined();
    expect(await violations()).toEqual([]);
  });

  it("a routine's own page", async () => {
    await openDashboard();
    const table = screen.getByRole("table");
    const firstRoutine = within(table).getAllByRole("button").find((button) => button.closest("tbody") !== null);
    if (firstRoutine === undefined) throw new Error("The sample has no routines in the list");
    fireEvent.click(firstRoutine);

    expect(screen.getByRole("button", { name: /Tilbake til listen/ })).toBeDefined();
    expect(await violations()).toEqual([]);
  });

  it("an open info bubble", async () => {
    await openDashboard();
    fireEvent.click(screen.getByRole("button", { name: "Mer om snittdekning" }));

    expect(screen.getByRole("dialog", { name: "Snittdekning" })).toBeDefined();
    expect(await violations()).toEqual([]);
  });
});

describe("moving between pages", () => {
  it("moves focus to the page heading", async () => {
    await openDashboard();
    openPage("Søk");

    const heading = screen.getByRole("heading", { level: 1, name: "Søk" });
    expect(document.activeElement).toBe(heading);
  });

  it("lets the skip link jump past the menu", async () => {
    await openDashboard();
    fireEvent.click(screen.getByRole("link", { name: "Hopp til hovedinnholdet" }));

    expect(document.activeElement).toBe(screen.getByRole("main"));
  });
});
