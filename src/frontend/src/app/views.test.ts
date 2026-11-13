import { describe, expect, it } from "vitest";
import { navigationFor } from "./views";

describe("navigationFor", () => {
  it("keeps Om analysen last in the menu, for admins and others", () => {
    expect(navigationFor("admin").at(-1)?.view).toBe("about");
    expect(navigationFor("user").at(-1)?.view).toBe("about");
  });

  it("shows Importer data only to admins", () => {
    expect(navigationFor("admin").some((entry) => entry.view === "import")).toBe(true);
    expect(navigationFor("user").some((entry) => entry.view === "import")).toBe(false);
  });
});
