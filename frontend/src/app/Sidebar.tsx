import { NAVIGATION, type ViewName } from "./views";
import styles from "./Sidebar.module.css";
import { classNames } from "../components/classNames";

interface SidebarProps {
  currentView: ViewName;
  routineCount: number;
  reviewCount: number;
  lastRunLabel: string;
  isExample: boolean;
  questionCount: number;
  documentCount: number;
  onNavigate: (view: ViewName) => void;
}

function navigationBadge(view: ViewName, routineCount: number, reviewCount: number): string {
  if (view === "list") return String(routineCount);
  if (view === "review") return String(reviewCount);
  return "";
}

export function Sidebar({
  currentView,
  routineCount,
  reviewCount,
  lastRunLabel,
  isExample,
  questionCount,
  documentCount,
  onNavigate,
}: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandName}>Kunnskapsgap</div>
        <div className={styles.brandSubtitle}>ServiceNow × Kvaliteket</div>
      </div>

      <nav className={styles.nav} aria-label="Hovedmeny">
        {NAVIGATION.map((entry) => {
          const active = entry.view === currentView;
          return (
            <button
              key={entry.view}
              type="button"
              className={active ? classNames(styles.navItem, styles.navItemActive) : styles.navItem}
              aria-current={active ? "page" : undefined}
              onClick={() => {
                onNavigate(entry.view);
              }}
            >
              <span>{entry.label}</span>
              <span className={styles.navBadge}>
                {navigationBadge(entry.view, routineCount, reviewCount)}
              </span>
            </button>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.footerSection}>
          <div className={styles.footerLabel}>Siste analyse</div>
          <div className={styles.footerValue}>{lastRunLabel}</div>
          <div className={styles.footerNote}>
            {questionCount} henvendelser · {documentCount} rutiner
          </div>
        </div>

        {isExample ? (
          <p className={styles.footerNote}>
            Eksempeldata. Ingen ekte henvendelser eller rutiner er brukt.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
