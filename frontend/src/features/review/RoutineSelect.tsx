import type { RoutineCode, RoutineDocument } from "../../domain/types";
import styles from "./RoutineSelect.module.css";

interface RoutineSelectProps {
  value: RoutineCode;
  /** Every routine, alphabetically. */
  routines: RoutineDocument[];
  /** When set, an unselectable first option shown while `value` is "". */
  placeholder?: string;
  onChange: (routineCode: RoutineCode) => void;
}

export function RoutineSelect({ value, routines, placeholder, onChange }: RoutineSelectProps) {
  return (
    <select
      className={styles.select}
      aria-label="Rutinen det hører til"
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
