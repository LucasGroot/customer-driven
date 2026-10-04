import type { ReactNode } from "react";
import styles from "./Button.module.css";
import { classNames } from "./classNames";

interface ButtonProps {
  variant: "primary" | "secondary" | "link";
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}

export function Button({ variant, onClick, disabled = false, children }: ButtonProps) {
  return (
    <button
      type="button"
      className={classNames(styles.base, styles[variant])}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
