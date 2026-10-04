import styles from "./PageIntro.module.css";

interface PageIntroProps {
  title: string;
  lead: string;
}

export function PageIntro({ title, lead }: PageIntroProps) {
  return (
    <div className={styles.intro}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lead}>{lead}</p>
    </div>
  );
}
