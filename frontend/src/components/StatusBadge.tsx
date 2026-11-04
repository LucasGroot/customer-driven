import { STATUS_LABEL } from "../domain/labels";
import type { RoutineStatus } from "../domain/types";
import { Badge, type BadgeTone } from "./Badge";
import styles from "./StatusBadge.module.css";

const STATUS_TONE: Record<RoutineStatus, BadgeTone> = {
  unprocessed: "accent",
  "in-progress": "warning",
};

interface StatusBadgeProps {
  status: RoutineStatus;
  /** Who is working on the routine. Shown under the badge when there is one. */
  owner?: string | undefined;
}

export function StatusBadge({ status, owner }: StatusBadgeProps) {
  return (
    <div className={styles.status}>
      <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
      {owner === undefined ? null : <span className={styles.owner}>Behandles av {owner}</span>}
    </div>
  );
}
