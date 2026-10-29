import { useState } from "react";
import { ImportError, uploadData, type ImportResult } from "../../api/adminApi";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { PageIntro } from "../../components/PageIntro";
import { FilePicker } from "./FilePicker";
import styles from "./ImportView.module.css";

type UploadOutcome = { kind: "saved" | "unchanged" | "failed"; message: string };

function countRoutines(count: number): string {
  return `${String(count)} ${count === 1 ? "rutine" : "rutiner"}`;
}

function describeImport(result: ImportResult): UploadOutcome {
  const parts: string[] = [];
  if (result.questionsReplaced) parts.push("ServiceNow-eksporten er byttet ut");
  const added = result.routinesAdded.length;
  if (added > 0) parts.push(`${countRoutines(added)} er lagt til`);
  // The backend refuses an upload without files, so nothing saved means every routine was skipped
  if (parts.length === 0) {
    return { kind: "unchanged", message: "Alle de valgte rutinene var lastet opp fra før. Ingenting nytt ble lagret." };
  }

  const skipped = result.routinesSkipped.length;
  const skippedNote = skipped > 0 ? ` ${countRoutines(skipped)} var lastet opp fra før og ble hoppet over.` : "";
  return {
    kind: "saved",
    message: `${parts.join(" og ")}.${skippedNote} Kjør en ny analyse for å oppdatere listen.`,
  };
}

interface ImportViewProps {
  accessToken: string;
  onOpenRun: () => void;
}

/** Where an administrator uploads new ServiceNow and Kvaliteket data before a new analysis. */
export function ImportView({ accessToken, onOpenRun }: ImportViewProps) {
  const [questionFiles, setQuestionFiles] = useState<File[]>([]);
  const [routineFiles, setRoutineFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [outcome, setOutcome] = useState<UploadOutcome | null>(null);

  const chosenCount = questionFiles.length + routineFiles.length;

  const upload = () => {
    setIsUploading(true);
    setOutcome(null);
    void uploadData(accessToken, questionFiles[0], routineFiles)
      .then(
        (result) => {
          setQuestionFiles([]);
          setRoutineFiles([]);
          setOutcome(describeImport(result));
        },
        (error: unknown) => {
          const message =
            error instanceof ImportError ? error.message : "Opplastingen feilet. Prøv igjen senere.";
          setOutcome({ kind: "failed", message });
        },
      )
      .finally(() => {
        setIsUploading(false);
      });
  };

  return (
    <section className={styles.view}>
      <PageIntro
        title="Last opp data"
        lead="Bare administratorer ser denne siden. Last opp henvendelsene fra ServiceNow og rutinene fra Kvaliteket, og kjør deretter en ny analyse."
      />

      <div className={styles.cards}>
        <Card title="ServiceNow-henvendelser">
          <p className={styles.description}>
            Excel-fil (.xlsx) eksportert fra ServiceNow. Den erstatter forrige eksport. Kolonnene
            «Kort beskrivelse» og «Beskrivelse» leses som spørsmålet.
          </p>
          <FilePicker
            buttonLabel="Velg Excel-fil"
            accept=".xlsx"
            files={questionFiles}
            onChange={setQuestionFiles}
          />
        </Card>

        <Card title="Kvaliteket-rutiner">
          <p className={styles.description}>
            PDF-filer med rutiner fra Kvaliteket. De legges til rutinene som allerede er lastet opp.
            Rutiner som finnes fra før, hoppes over, så du kan velge hele mappen på nytt.
          </p>
          <FilePicker
            buttonLabel="Velg PDF-filer"
            accept=".pdf"
            multiple
            files={routineFiles}
            onChange={setRoutineFiles}
          />
        </Card>
      </div>

      <div className={styles.uploadRow}>
        <Button variant="primary" disabled={chosenCount === 0 || isUploading} onClick={upload}>
          {isUploading ? "Laster opp …" : "Last opp"}
        </Button>
        {outcome === null ? (
          <span className={styles.hint}>Filene lagres bare på dashbordets egen server.</span>
        ) : (
          <span
            className={outcome.kind === "failed" ? styles.error : styles.hint}
            role={outcome.kind === "failed" ? "alert" : "status"}
          >
            {outcome.message}
          </span>
        )}
        {outcome?.kind === "saved" ? (
          <Button variant="link" onClick={onOpenRun}>
            Gå til «Kjør analyse»
          </Button>
        ) : null}
      </div>
    </section>
  );
}
