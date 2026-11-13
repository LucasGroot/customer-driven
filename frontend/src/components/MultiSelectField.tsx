import { useEffect, useId, useRef, useState } from "react";
import styles from "./MultiSelectField.module.css";

interface MultiSelectFieldProps<Value extends string> {
  label: string;
  selected: Value[];
  options: { value: Value; label: string }[];
  /** Shown on the button when nothing is ticked, which means no filtering. */
  noneSelectedLabel: string;
  onChange: (selected: Value[]) => void;
}

/** Looks like a SelectField, but opens a list of checkboxes so several values can be picked. */
export function MultiSelectField<Value extends string>({
  label,
  selected,
  options,
  noneSelectedLabel,
  onChange,
}: MultiSelectFieldProps<Value>) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const listId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && wrapperRef.current?.contains(target) === true) return;
      setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      buttonRef.current?.focus();
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const toggleValue = (value: Value) => {
    const next = selected.includes(value)
      ? selected.filter((current) => current !== value)
      : [...selected, value];
    // Kept in option order, so the button text does not depend on click order
    onChange(options.map((option) => option.value).filter((optionValue) => next.includes(optionValue)));
  };

  const selectedLabels = options.filter((option) => selected.includes(option.value)).map((option) => option.label);
  const summary = selectedLabels.length === 0 ? noneSelectedLabel : selectedLabels.join(", ");

  return (
    <div ref={wrapperRef} className={styles.field}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        aria-labelledby={`${labelId} ${listId}-summary`}
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        onClick={() => {
          setIsOpen((open) => !open);
        }}
      >
        <span id={`${listId}-summary`} className={styles.summary}>
          {summary}
        </span>
        <span className={styles.chevron} aria-hidden="true" />
      </button>
      {isOpen ? (
        <fieldset id={listId} className={styles.list}>
          <legend className="visuallyHidden">{label}</legend>
          {options.map((option) => (
            <label key={option.value} className={styles.option}>
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => {
                  toggleValue(option.value);
                }}
              />
              {option.label}
            </label>
          ))}
          <button
            type="button"
            className={styles.clear}
            disabled={selected.length === 0}
            onClick={() => {
              onChange([]);
            }}
          >
            Vis alle
          </button>
        </fieldset>
      ) : null}
    </div>
  );
}
