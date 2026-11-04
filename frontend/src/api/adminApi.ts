/**
 * The admin page's calls to the backend: uploading new data and running the
 * analysis. The backend refuses both for anyone but an administrator.
 */

export interface ImportResult {
  questionsReplaced: boolean;
  routinesAdded: string[];
  /** Routines that were already uploaded, so they were left out. */
  routinesSkipped: string[];
}

export interface AnalysisStatus {
  state: "idle" | "running" | "finished" | "failed";
  /** How many of the run page's steps are done. */
  completedSteps: number;
}

/** Why the backend refused an upload, as sent in the response's detail. */
interface RefusalDetail {
  reason?: string;
  file?: string;
  files?: string[];
  columns?: string[];
  expected?: string;
  maxMegabytes?: number;
}

const FILE_TYPE_LABEL: Record<string, string> = { xlsx: "Excel-fil (.xlsx)", pdf: "PDF-fil" };

/** Turns the backend's reason for refusing an upload into a message for the administrator. */
export function importErrorMessage(status: number, detail: RefusalDetail | undefined): string {
  const fileList = (detail?.files ?? []).map((name) => `«${name}»`).join(", ");
  switch (detail?.reason) {
    case "noFiles":
      return "Velg minst én fil.";
    case "wrongType":
      return `«${detail.file ?? ""}» er ikke en ${FILE_TYPE_LABEL[detail.expected ?? ""] ?? "gyldig fil"}.`;
    case "tooLarge":
      return `«${detail.file ?? ""}» er for stor. Største tillatte størrelse er ${String(detail.maxMegabytes)} MB.`;
    case "invalidName":
      return `Filnavnet «${detail.file ?? ""}» kan ikke brukes. Gi filen et vanlig navn og prøv igjen.`;
    case "unreadable":
      return "Excel-filen kunne ikke leses. Eksporter den på nytt fra ServiceNow.";
    case "missingColumns":
      return `Excel-filen mangler kolonnene ${(detail.columns ?? []).map((name) => `«${name}»`).join(", ")}.`;
    case "duplicateQuestionNumbers":
      return "Excel-filen har flere henvendelser med samme nummer.";
    case "noQuestions":
      return "Excel-filen har ingen henvendelser.";
    case "routineChosenTwice":
      return `Samme rutine er valgt flere ganger: ${fileList}. Velg bare én av dem.`;
    case "analysisRunning":
      return "En analyse kjører nå. Vent til den er ferdig, og prøv igjen.";
    default:
      if (status === 401 || status === 403) return "Du har ikke tilgang til å laste opp data.";
      return "Opplastingen feilet. Prøv igjen senere.";
  }
}

export class ImportError extends Error {}

function authorization(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function uploadData(
  accessToken: string,
  questions: File | undefined,
  routines: File[],
): Promise<ImportResult> {
  const body = new FormData();
  if (questions !== undefined) body.append("questions", questions);
  for (const routine of routines) body.append("routines", routine);

  const response = await fetch("/api/admin/import", {
    method: "POST",
    headers: authorization(accessToken),
    body,
  });
  if (!response.ok) {
    const refusal = (await response.json().catch(() => ({}))) as { detail?: RefusalDetail };
    throw new ImportError(importErrorMessage(response.status, refusal.detail));
  }
  return (await response.json()) as ImportResult;
}

/** Starts a run. A run that is already going counts as started, so the page follows that one. */
export async function startAnalysis(accessToken: string): Promise<void> {
  const response = await fetch("/api/admin/analysis", { method: "POST", headers: authorization(accessToken) });
  if (!response.ok && response.status !== 409) {
    throw new Error(`Backend svarte ${String(response.status)} på /api/admin/analysis.`);
  }
}

export async function fetchAnalysisStatus(
  accessToken: string,
  signal: AbortSignal | null = null,
): Promise<AnalysisStatus> {
  const response = await fetch("/api/admin/analysis", { signal, headers: authorization(accessToken) });
  if (!response.ok) {
    throw new Error(`Backend svarte ${String(response.status)} på /api/admin/analysis.`);
  }
  return (await response.json()) as AnalysisStatus;
}
