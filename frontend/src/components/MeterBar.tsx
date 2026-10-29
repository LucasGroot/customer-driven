import styles from "./MeterBar.module.css";
import { classNames } from "./classNames";

interface MeterBarProps {
  /** Fill level, 0-1. */
  value: number;
  color: string;
  thick?: boolean;
}

/**
 * Decorative by design: every meter in the dashboard sits next to the same
 * number in text, so announcing it twice would only add noise.
 */
export function MeterBar({ value, color, thick = false }: MeterBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className={thick ? classNames(styles.track, styles.thick) : styles.track} aria-hidden="true">
      <div className={styles.fill} style={{ width: `${String(percent)}%`, background: color }} />
    </div>
  );
}
