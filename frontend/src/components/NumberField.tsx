import { useId, useState } from "react";
import styles from "./NumberField.module.css";

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Shown after the field, e.g. "%". */
  suffix?: string;
  onChange: (value: number) => void;
}

/**
 * A number input that lets the text be empty or half-typed while editing.
 * Only valid numbers reach `onChange`, clamped to the range, and the field
 * shows the committed value again when it loses focus.
 */
export function NumberField({ label, value, min, max, step = 1, suffix, onChange }: NumberFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className={styles.input}
        type="number"
        min={min}
        max={max}
        step={step}
        value={draft ?? String(value)}
        onChange={(event) => {
          const text = event.target.value;
          setDraft(text);
          const parsed = Number(text);
          if (text.trim() !== "" && Number.isFinite(parsed)) {
            onChange(Math.min(max, Math.max(min, parsed)));
          }
        }}
        onBlur={() => {
          setDraft(null);
        }}
      />
      {suffix === undefined ? null : <span>{suffix}</span>}
    </div>
  );
}
