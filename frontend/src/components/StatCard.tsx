import styles from "./StatCard.module.css";

interface StatCardProps {
  label: string;
  value: string;
  note: string;
  onClick?: () => void;
}

export function StatCard({ label, value, note, onClick }: StatCardProps) {
  return (
    <div
      className={styles.card}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      <div className={styles.note}>{note}</div>
    </div>
  );
}
