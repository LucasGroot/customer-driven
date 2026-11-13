import { Badge, type BadgeTone } from "../../components/Badge";
import type { Placement } from "../../domain/routines";

const PLACEMENT_BADGE: Record<Placement["kind"], { tone: BadgeTone; label: string }> = {
  routine: { tone: "accent", label: "Knyttet til rutine" },
  pending: { tone: "warning", label: "Til gjennomgang" },
  discarded: { tone: "neutral", label: "Forkastet" },
};

interface PlacementBadgeProps {
  placement: Placement;
}

/** Whether a question belongs to a routine, waits for HR's review, or was discarded. */
export function PlacementBadge({ placement }: PlacementBadgeProps) {
  const { tone, label } = PLACEMENT_BADGE[placement.kind];
  return <Badge tone={tone}>{label}</Badge>;
}
