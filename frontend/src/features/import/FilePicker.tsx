import { useRef } from "react";
import styles from "./FilePicker.module.css";

interface FilePickerProps {
  buttonLabel: string;
  /** File types the browser's picker offers, e.g. ".pdf". */
  accept: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
}

function describeFiles(files: File[]): string {
  if (files.length === 0) return "Ingen fil valgt";
  if (files.length === 1) return files[0]?.name ?? "";
  return `${String(files.length)} filer valgt`;
}

/**
 * A button that opens the browser's file picker. The native file input cannot
 * be styled like the rest of the dashboard, so it stays hidden behind the button.
 */
export function FilePicker({ buttonLabel, accept, multiple = false, files, onChange }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.picker}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(event) => {
          onChange(Array.from(event.target.files ?? []));
          // Lets the same file be picked again after the list was cleared by an upload
          event.target.value = "";
        }}
      />
      <button
        type="button"
        className={styles.button}
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        {buttonLabel}
      </button>
      <span className={styles.chosen} aria-live="polite">
        {describeFiles(files)}
      </span>
    </div>
  );
}
