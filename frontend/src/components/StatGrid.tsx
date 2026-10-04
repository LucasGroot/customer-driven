import type { ReactNode } from "react";
import styles from "./StatGrid.module.css";

/** The row of stat cards at the top of a page. */
export function StatGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}
