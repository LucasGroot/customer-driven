import { classNames } from "../../components/classNames";
import styles from "./ListedBadge.module.css";

interface ListedBadgeProps {
  listed: boolean;
}

/** Whether a question's topic is in the prioritised list or hidden as covered. */
export function ListedBadge({ listed }: ListedBadgeProps) {
  return (
    <span className={classNames(styles.badge, listed ? styles.listed : styles.hidden)}>
      {listed ? "Vises i listen" : "Skjult"}
    </span>
  );
}
