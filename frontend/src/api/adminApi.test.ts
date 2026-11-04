import { afterEach, describe, expect, it, vi } from "vitest";
import { ImportError, importErrorMessage, uploadData } from "./adminApi";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("importErrorMessage", () => {
  it("names every routine chosen twice", () => {
    const message = importErrorMessage(409, {
      reason: "routineChosenTwice",
      files: ["1760-1-Vernerunde.pdf", "1760-1-Vernerunde (1).pdf"],
    });

    expect(message).toBe(
      "Samme rutine er valgt flere ganger: «1760-1-Vernerunde.pdf», «1760-1-Vernerunde (1).pdf». Velg bare én av dem.",
    );
  });

  it("lists the columns an export is missing", () => {
    const message = importErrorMessage(400, { reason: "missingColumns", columns: ["Nummer", "Beskrivelse"] });

    expect(message).toBe("Excel-filen mangler kolonnene «Nummer», «Beskrivelse».");
  });

  it("explains a refusal for someone who is not an administrator", () => {
    expect(importErrorMessage(403, undefined)).toBe("Du har ikke tilgang til å laste opp data.");
  });
});

describe("uploadData", () => {
  it("sends the files as a form and returns what was saved", async () => {
    const result = { questionsReplaced: false, routinesAdded: ["1760-1-Vernerunde.pdf"], routinesSkipped: [] };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(result));
    vi.stubGlobal("fetch", fetchMock);

    const routine = new File(["%PDF-"], "1760-1-Vernerunde.pdf");
    await expect(uploadData("token", undefined, [routine])).resolves.toEqual(result);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.body as FormData).getAll("routines")).toEqual([routine]);
    expect((init.body as FormData).has("questions")).toBe(false);
  });

  it("rejects with the administrator's message when the backend refuses", async () => {
    const refusal = { detail: { reason: "analysisRunning" } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(refusal, { status: 409 })));

    const upload = uploadData("token", undefined, [new File(["%PDF-"], "a.pdf")]);

    await expect(upload).rejects.toThrow(ImportError);
    await expect(upload).rejects.toThrow("En analyse kjører nå.");
  });
});
