import { NAVIGATION, isNavigationActive, type ViewName } from "./views";
import styles from "./Sidebar.module.css";
import { classNames } from "../components/classNames";

interface SidebarProps {
  currentView: ViewName;
  gapCount: number;
  lastRunLabel: string;
  ticketCount: number;
  routineCount: number;
  onNavigate: (view: ViewName) => void;
}

export function Sidebar({
  currentView,
  gapCount,
  lastRunLabel,
  ticketCount,
  routineCount,
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
          const active = isNavigationActive(entry, currentView);
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
                {entry.view === "list" ? gapCount : ""}
              </span>
            </button>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.footerLabel}>Siste analyse</div>
        <div className={styles.footerValue}>{lastRunLabel}</div>
        <div className={styles.footerNote}>
          {ticketCount} henvendelser · {routineCount} rutiner
        </div>
      </div>
    </aside>
  );
}
