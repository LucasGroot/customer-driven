import { STATUS_LABEL } from "../domain/labels";
import type { RoutineStatus } from "../domain/types";
import { Badge, type BadgeTone } from "./Badge";

const STATUS_TONE: Record<RoutineStatus, BadgeTone> = {
  new: "accent",
  updating: "warning",
  done: "success",
};

interface StatusBadgeProps {
  status: RoutineStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}
