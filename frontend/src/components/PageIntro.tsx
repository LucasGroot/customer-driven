import styles from "./PageIntro.module.css";
import { classNames } from "./classNames";

interface PageIntroProps {
  title: string;
  lead: string;
  compact?: boolean;
}

export function PageIntro({ title, lead, compact = false }: PageIntroProps) {
  return (
    <div className={compact ? classNames(styles.intro, styles.compact) : styles.intro}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lead}>{lead}</p>
    </div>
  );
}
