import type { RoutineCode, RoutineDocument } from "../../domain/types";
import styles from "./RoutineSelect.module.css";

interface RoutineSelectProps {
  value: RoutineCode;
  /** Every routine, alphabetically. */
  routines: RoutineDocument[];
  onChange: (routineCode: RoutineCode) => void;
}

/** Picks the routine a question, or a group of questions, belongs to. */
export function RoutineSelect({ value, routines, onChange }: RoutineSelectProps) {
  return (
    <select
      className={styles.select}
      aria-label="Rutinen det hører til"
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    >
      {routines.map((routine) => (
        <option key={routine.code} value={routine.code}>
          {routine.name}
        </option>
      ))}
    </select>
  );
}
