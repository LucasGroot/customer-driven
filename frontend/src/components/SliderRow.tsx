import { useId } from "react";
import styles from "./SliderRow.module.css";

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (value: number) => void;
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: SliderRowProps) {
  const sliderId = useId();
  return (
    <div className={styles.row}>
      <label className={styles.label} htmlFor={sliderId}>
        {label}
      </label>
      <input
        id={sliderId}
        className={styles.slider}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          onChange(Number(event.target.value));
        }}
      />
      <span className={styles.value}>{displayValue}</span>
    </div>
  );
}
