import { STATUS_LABEL } from "../domain/labels";
import type { GapStatus } from "../domain/types";
import styles from "./StatusBadge.module.css";
import { classNames } from "./classNames";

interface StatusBadgeProps {
  status: GapStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={classNames(styles.badge, styles[status])}>{STATUS_LABEL[status]}</span>;
}
