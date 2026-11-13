import styles from "./FilterPill.module.css";
import { classNames } from "./classNames";

interface FilterPillProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export function FilterPill({ label, selected, onSelect }: FilterPillProps) {
  return (
    <button
      type="button"
      className={selected ? classNames(styles.pill, styles.selected) : styles.pill}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {label}
    </button>
  );
}
