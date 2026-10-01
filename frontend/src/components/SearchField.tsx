import { useRef } from "react";
import styles from "./SearchField.module.css";

interface SearchFieldProps {
  /** Read by screen readers; the field has no visible label. */
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function SearchField({ label, value, placeholder, onChange }: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={styles.field}>
      <input
        ref={inputRef}
        type="search"
        className={styles.input}
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
      {value === "" ? null : (
        <button
          type="button"
          className={styles.clear}
          aria-label="Tøm søket"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
