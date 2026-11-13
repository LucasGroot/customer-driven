// @vitest-environment jsdom
/**
 * Opens every page of the dashboard on the bundled sample of invented data and
 * checks it with axe against WCAG 2.1 AA. Contrast is left out here, as jsdom
 * draws nothing to measure; tokens.test.ts checks the colours instead.
 */

import { cleanup, fireEvent, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PAGES, firstRoutineButton, openDashboard, openPage, resetPage, stubApi } from "./dashboardTestSupport";

async function violations(): Promise<string[]> {
  const results = await axe.run(document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map(
    (violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target.join(" ")).join(", ")})`,
  );
}

beforeEach(() => {
  resetPage();
  stubApi();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("every page meets WCAG 2.1 AA", () => {
  it.each(PAGES)("%s", async (menuLabel, heading) => {
    await openDashboard();
    openPage(menuLabel);

    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeDefined();
    expect(await violations()).toEqual([]);
  });

  it("a routine's own page", async () => {
    await openDashboard();
    openPage("Prioriterte rutiner");
    fireEvent.click(firstRoutineButton());

    expect(screen.getByRole("button", { name: /Tilbake til listen/ })).toBeDefined();
    expect(await violations()).toEqual([]);
  });

  it("an open info bubble", async () => {
    await openDashboard();
    openPage("Prioriterte rutiner");
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
