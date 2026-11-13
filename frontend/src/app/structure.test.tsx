// @vitest-environment jsdom
/**
 * What the WCAG run in accessibility.test.tsx does not look at: how each page is
 * built (headings, landmarks, tab order), how focus moves, and whether changes,
 * failures and errors reach a screen reader. Together with that file this covers
 * the keyboard and screen reader checks for WCAG 2.1 AA.
 */

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { ADMIN, PAGES, firstRoutineButton, openDashboard, openPage, resetPage, stubApi } from "./dashboardTestSupport";

// Rules axe counts as good practice rather than WCAG, so the WCAG run leaves them out
const STRUCTURE_RULES = [
  "heading-order",
  "page-has-heading-one",
  "landmark-one-main",
  "landmark-unique",
  "region",
  "skip-link",
  "tabindex",
];

async function structureViolations(): Promise<string[]> {
  const results = await axe.run(document, { runOnly: { type: "rule", values: STRUCTURE_RULES } });
  return results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target.join(" ")).join(", ")})`,
  );
}

function headingLevels(): number[] {
  return [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].map((heading) => Number(heading.tagName.slice(1)));
}

beforeEach(() => {
  resetPage();
  stubApi();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("how every page is built", () => {
  it.each(PAGES)("%s has one h1, headings in order and the landmarks", async (menuLabel) => {
    await openDashboard();
    openPage(menuLabel);

    expect(headingLevels().filter((level) => level === 1)).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    expect(await structureViolations()).toEqual([]);
  });

  it("a routine's own page has the same structure", async () => {
    await openDashboard();
    openPage("Prioriterte rutiner");
    fireEvent.click(firstRoutineButton());

    expect(headingLevels().filter((level) => level === 1)).toHaveLength(1);
    expect(await structureViolations()).toEqual([]);
  });
});

describe("keyboard and focus", () => {
  it("Escape closes an information bubble and gives focus back to its button", async () => {
    await openDashboard();
    openPage("Prioriterte rutiner");
    const button = screen.getByRole("button", { name: "Mer om snittdekning" });
    fireEvent.click(button);
    expect(screen.getByRole("dialog", { name: "Snittdekning" })).toBeDefined();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("opening a routine moves focus to its heading, and Back returns to the list", async () => {
    await openDashboard();
    openPage("Prioriterte rutiner");
    const routineName = firstRoutineButton().textContent;
    fireEvent.click(firstRoutineButton());

    const routineHeading = screen.getByRole("heading", { level: 1, name: routineName });
    expect(document.activeElement).toBe(routineHeading);

    fireEvent.click(screen.getByRole("button", { name: /Tilbake til listen/ }));

    // The browser handles Back after the click, so the list is shown a moment later
    const listHeading = await screen.findByRole("heading", { level: 1, name: "Rutiner som bør oppdateres først" });
    await waitFor(() => {
      expect(document.activeElement).toBe(listHeading);
    });
  });

  it("a sortable column says which way it is sorted", async () => {
    await openDashboard();
    openPage("Prioriterte rutiner");
    const header = within(screen.getByRole("table")).getByRole("columnheader", { name: /^Rutine/ });
    expect(header.getAttribute("aria-sort")).toBe("none");

    // The header also holds an information button, so the sort button is picked by name
    fireEvent.click(within(header).getByRole("button", { name: "Rutine" }));
    expect(header.getAttribute("aria-sort")).toBe("ascending");

    fireEvent.click(within(header).getByRole("button", { name: "Rutine" }));
    expect(header.getAttribute("aria-sort")).toBe("descending");
  });
});

describe("what a screen reader is told", () => {
  it("says the analysis is loading, then fails with an alert when it cannot be fetched", async () => {
    stubApi((url) => (url === "/api/snapshot" ? new Response("", { status: 500 }) : undefined));
    render(<App user={ADMIN} accessToken="token" onSignOut={() => {}} />);

    expect(screen.getByRole("status").textContent).toContain("Henter analysen");
    expect((await screen.findByRole("alert")).textContent).toContain("Kunne ikke hente analysen");
  });

  it("has the status on the run page in place before anything happens", async () => {
    await openDashboard();
    openPage("Kjør analyse");

    // A status that appears with its text already in it is often skipped, so it has to exist first
    const status = screen.getByRole("status");
    expect(status.textContent).toContain("Bruker filene som sist ble lastet opp");
  });

  it("announces an upload the backend refuses, in words that say what to do", async () => {
    stubApi((url) =>
      url === "/api/admin/import" ? Response.json({ detail: { reason: "unreadable" } }, { status: 400 }) : undefined,
    );
    await openDashboard();
    openPage("Importer data");

    const status = screen.getByRole("status");
    expect(status.textContent).toContain("Filene lagres bare");

    const input = document.querySelector<HTMLInputElement>('input[type="file"][accept=".xlsx"]');
    if (input === null) throw new Error("The import page has no Excel file input");
    const file = new File(["not an export"], "henvendelser.xlsx");
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Last opp" }));

    // The same element as before, so the change is read out
    await waitFor(() => {
      expect(status.textContent).toContain("Eksporter den på nytt fra ServiceNow");
    });
    expect(screen.getByRole("status")).toBe(status);
  });
});
