import { DECISION_LABEL, UNDECIDED_LABEL } from "../domain/labels";
import type { GapDecision } from "../domain/types";
import styles from "./StatusBadge.module.css";
import { classNames } from "./classNames";

interface StatusBadgeProps {
  decision: GapDecision | undefined;
}

export function StatusBadge({ decision }: StatusBadgeProps) {
  const variant = decision ?? "undecided";
  const label = decision === undefined ? UNDECIDED_LABEL : DECISION_LABEL[decision];
  return <span className={classNames(styles.badge, styles[variant])}>{label}</span>;
}
