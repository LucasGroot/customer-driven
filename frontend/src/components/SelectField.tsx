import { useId } from "react";
import styles from "./SelectField.module.css";
import { classNames } from "./classNames";

interface SelectFieldProps<Value extends string> {
  label: string;
  value: Value;
  options: { value: Value; label: string }[];
  /** Label beside the field (default) or above it, as in a form. */
  layout?: "inline" | "stacked";
  onChange: (value: Value) => void;
}

export function SelectField<Value extends string>({
  label,
  value,
  options,
  layout = "inline",
  onChange,
}: SelectFieldProps<Value>) {
  const id = useId();
  return (
    <div className={classNames(styles.field, styles[layout])}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className={styles.select}
        value={value}
        onChange={(event) => {
          // Every option comes from `options`, so the value is always one of them.
          onChange(event.target.value as Value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
