import { useState } from "react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { PageIntro } from "../../components/PageIntro";
import { FilePicker } from "./FilePicker";
import styles from "./ImportView.module.css";

/** Where an administrator uploads new ServiceNow and Kvaliteket data before a new analysis. */
export function ImportView() {
  const [questionFiles, setQuestionFiles] = useState<File[]>([]);
  const [routineFiles, setRoutineFiles] = useState<File[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const chosenCount = questionFiles.length + routineFiles.length;

  return (
    <section className={styles.view}>
      <PageIntro
        title="Last opp data"
        lead="Bare administratorer ser denne siden. Last opp henvendelsene fra ServiceNow og rutinene fra Kvaliteket, og kjør deretter en ny analyse."
      />

      <div className={styles.cards}>
        <Card title="ServiceNow-henvendelser">
          <p className={styles.description}>
            Excel-fil (.xlsx) eksportert fra ServiceNow. Kolonnene «Kort beskrivelse» og
            «Beskrivelse» leses som spørsmålet.
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
            PDF-filer med rutinene fra Kvaliteket. Du kan velge flere filer samtidig.
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
        <Button
          variant="primary"
          disabled={chosenCount === 0}
          onClick={() => {
            // Sending the files is the API's job; until the import endpoint
            // exists the button only confirms what was chosen.
            setNotice(`${String(chosenCount)} fil(er) valgt. Opplastingen er ikke koblet til ennå.`);
          }}
        >
          Last opp
        </Button>
        <span className={styles.hint} aria-live="polite">
          {notice ?? "I prototypen forlater ikke filene nettleseren din."}
        </span>
      </div>
    </section>
  );
}
