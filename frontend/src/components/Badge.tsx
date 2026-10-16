import type { ReactNode } from "react";
import styles from "./Badge.module.css";
import { classNames } from "./classNames";

export type BadgeTone = "accent" | "warning" | "success" | "neutral";

interface BadgeProps {
  tone: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone, children }: BadgeProps) {
  return <span className={classNames(styles.badge, styles[tone])}>{children}</span>;
}
