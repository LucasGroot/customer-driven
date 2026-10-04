import { Badge } from "../../components/Badge";

interface ListedBadgeProps {
  listed: boolean;
}

/** Whether a question's topic is in the prioritised list or hidden as covered. */
export function ListedBadge({ listed }: ListedBadgeProps) {
  return <Badge tone={listed ? "accent" : "neutral"}>{listed ? "Vises i listen" : "Skjult"}</Badge>;
}
