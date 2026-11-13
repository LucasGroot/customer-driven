import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSnapshot } from "./fetchSnapshot";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchSnapshot", () => {
  it("returns the snapshot the backend sends", async () => {
    const snapshot = { isExample: false, questions: [] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(snapshot)));

    await expect(fetchSnapshot("token", new AbortController().signal)).resolves.toEqual(snapshot);
  });

  it("rejects when the backend answers with an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 404 })));

    await expect(fetchSnapshot("token", new AbortController().signal)).rejects.toThrow("404");
  });
});
