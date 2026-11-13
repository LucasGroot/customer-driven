import styles from "./PageIntro.module.css";

interface PageIntroProps {
  title: string;
  lead: string;
}

export function PageIntro({ title, lead }: PageIntroProps) {
  return (
    <div className={styles.intro}>
      {/* tabIndex lets usePageFocus move focus here when the page opens */}
      <h1 className={styles.title} tabIndex={-1}>
        {title}
      </h1>
      <p className={styles.lead}>{lead}</p>
    </div>
  );
}
