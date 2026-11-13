import type { RoutineCode, RoutineDocument } from "../../domain/types";
import styles from "./RoutineSelect.module.css";

interface RoutineSelectProps {
  value: RoutineCode;
  /** Every routine, alphabetically. */
  routines: RoutineDocument[];
  /** The routines that matched best, best first. Listed above the others when given. */
  suggested?: RoutineCode[];
  /** When set, an unselectable first option shown while `value` is "". */
  placeholder?: string;
  /**
   * Read by screen readers. Name the question or group, since a page can hold
   * many of these and a list of identical names says nothing.
   */
  label: string;
  onChange: (routineCode: RoutineCode) => void;
}

export function RoutineSelect({ value, routines, suggested = [], placeholder, label, onChange }: RoutineSelectProps) {
  const routineByCode = new Map(routines.map((routine) => [routine.code, routine]));
  const suggestedRoutines = suggested.flatMap((code) => routineByCode.get(code) ?? []);
  const others = routines.filter((routine) => !suggestedRoutines.includes(routine));
  const options = (list: RoutineDocument[]) =>
    list.map((routine) => (
      <option key={routine.code} value={routine.code}>
        {routine.name}
      </option>
    ));

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
      {suggestedRoutines.length > 0 ? (
        <>
          <optgroup label="Foreslåtte rutiner">{options(suggestedRoutines)}</optgroup>
          <optgroup label="Alle rutiner">{options(others)}</optgroup>
        </>
      ) : (
        options(routines)
      )}
    </select>
  );
}
