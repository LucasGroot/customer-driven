/// <reference types="node" />
/**
 * What the accessibility tests share: the bundled sample of invented data, a
 * stand-in for the API, and the steps for opening the dashboard and moving
 * between its pages.
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { vi } from "vitest";
import type { CurrentUser } from "../auth/currentUser";
import { App } from "./App";

// The same sample the API serves when there is no real analysis. Read from disk,
// since Vite refuses imports from outside src/frontend/, which keeps data/ out of reach.
const samplePath = join(import.meta.dirname, "../../../backend/snapshot/sample_snapshot.json");
const sampleSnapshot: unknown = JSON.parse(readFileSync(samplePath, "utf8"));

export const ADMIN: CurrentUser = { name: "Test Testesen", email: "test@example.com", role: "admin" };

/** The pages in the menu, with the heading each one opens on. */
export const PAGES: [menuLabel: string, heading: string][] = [
  ["Oversikt", "Oversikt"],
  ["Prioriterte rutiner", "Rutiner som bør oppdateres først"],
  ["Henvendelser til manuell gjennomgang", "Henvendelser til manuell gjennomgang"],
  ["Kjør analyse", "Kjør analyse"],
  ["Søk", "Søk"],
  ["Importer data", "Last opp data"],
  ["Om analysen", "Om analysen"],
];

type Answer = (url: string, init: RequestInit | undefined) => Response | undefined;

/**
 * Answers the dashboard's API calls with the sample. `answer` can reply to a call
 * first, for a test that needs the API to fail or to refuse an upload.
 */
export function stubApi(answer: Answer = () => undefined) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) =>
      Promise.resolve(
        answer(url, init) ??
          (url === "/api/snapshot"
            ? Response.json(sampleSnapshot)
            : Response.json({ state: "idle", completedSteps: 0 })),
      ),
    ),
  );
}

/** What index.html gives the page and the test page does not load. */
export function resetPage() {
  // The dashboard puts the page it is on in the history entry, and reads it back on a refresh
  window.history.replaceState(null, "");
  document.documentElement.lang = "nb";
  document.title = "Kunnskapsgap";
}

export async function openDashboard() {
  render(<App user={ADMIN} accessToken="token" onSignOut={() => {}} />);
  await screen.findByRole("heading", { level: 1, name: "Oversikt" });
}

export function openPage(label: string) {
  const menu = screen.getByRole("navigation", { name: "Hovedmeny" });
  // The menu entries with a count carry it in their name, so match the start only
  fireEvent.click(within(menu).getByRole("button", { name: new RegExp(`^${label}`) }));
}

/** The first routine in the list, which the list page must be showing. */
export function firstRoutineButton(): HTMLElement {
  const table = screen.getByRole("table");
  const button = within(table)
    .getAllByRole("button")
    .find((candidate) => candidate.closest("tbody") !== null);
  if (button === undefined) throw new Error("The sample has no routines in the list");
  return button;
}
