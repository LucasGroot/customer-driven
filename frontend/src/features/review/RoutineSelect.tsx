import type { RoutineCode, RoutineDocument } from "../../domain/types";
import styles from "./RoutineSelect.module.css";

interface RoutineSelectProps {
  value: RoutineCode;
  /** Every routine, alphabetically. */
  routines: RoutineDocument[];
  /** When set, an unselectable first option shown while `value` is "". */
  placeholder?: string;
  /**
   * Read by screen readers. Name the question or group, since a page can hold
   * many of these and a list of identical names says nothing.
   */
  label: string;
  onChange: (routineCode: RoutineCode) => void;
}

export function RoutineSelect({ value, routines, placeholder, label, onChange }: RoutineSelectProps) {
  return (
    <select
      className={styles.select}
      aria-label={label}
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    >
      {placeholder !== undefined ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {routines.map((routine) => (
        <option key={routine.code} value={routine.code}>
          {routine.name}
        </option>
      ))}
    </select>
  );
}
