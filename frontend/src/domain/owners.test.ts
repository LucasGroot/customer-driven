import { describe, expect, it } from "vitest";
import { ownerCandidates } from "./owners";

describe("ownerCandidates", () => {
  it("puts the signed-in user first and then the others", () => {
    expect(ownerCandidates(["Lene Fjeld", "Tor Bergli"], "Yaël")).toEqual([
      "Yaël",
      "Lene Fjeld",
      "Tor Bergli",
      "Kari Nordmann",
      "Ola Nordmann",
    ]);
  });

  it("never offers Ikke tildelt, since that is no owner", () => {
    expect(ownerCandidates(["Ikke tildelt", "Lene Fjeld"], "Yaël")).toEqual([
      "Yaël",
      "Lene Fjeld",
      "Kari Nordmann",
      "Ola Nordmann",
    ]);
  });

  it("does not list the signed-in user twice", () => {
    expect(ownerCandidates(["Yaël", "Lene Fjeld"], "Yaël")).toEqual([
      "Yaël",
      "Lene Fjeld",
      "Kari Nordmann",
      "Ola Nordmann",
    ]);
  });
});
