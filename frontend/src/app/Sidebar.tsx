import { navigationFor, type ViewName } from "./views";
import styles from "./Sidebar.module.css";
import type { CurrentUser } from "../auth/currentUser";
import { Button } from "../components/Button";
import { classNames } from "../components/classNames";

interface SidebarProps {
  currentView: ViewName;
  routineCount: number;
  reviewCount: number;
  lastRunLabel: string;
  isExample: boolean;
  questionCount: number;
  documentCount: number;
  user: CurrentUser;
  onNavigate: (view: ViewName) => void;
  onSignOut: () => void;
}

interface NavigationBadge {
  count: string;
  /** What the number counts, for screen readers, which would otherwise read a bare number. */
  meaning: string;
}

function navigationBadge(view: ViewName, routineCount: number, reviewCount: number): NavigationBadge | null {
  if (view === "list") return { count: String(routineCount), meaning: "rutiner i listen" };
  if (view === "review") return { count: String(reviewCount), meaning: "henvendelser venter" };
  return null;
}

export function Sidebar({
  currentView,
  routineCount,
  reviewCount,
  lastRunLabel,
  isExample,
  questionCount,
  documentCount,
  user,
  onNavigate,
  onSignOut,
}: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <button
          type="button"
          onClick={() => {
            onNavigate("summary");
          }}
        >
          <span className={styles.brandName}>Kunnskapsgap</span>
          <span className={styles.brandSubtitle}>ServiceNow × Kvaliteket</span>
        </button>
      </div>

      <nav className={styles.nav} aria-label="Hovedmeny">
        {navigationFor(user.role).map((entry) => {
          const active = entry.view === currentView;
          const badge = navigationBadge(entry.view, routineCount, reviewCount);
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
              {badge === null ? null : (
                <span className={styles.navBadge}>
                  <span aria-hidden="true">{badge.count}</span>
                  <span className="visuallyHidden">
                    , {badge.count} {badge.meaning}
                  </span>
                </span>
              )}
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

        <div className={styles.footerSection}>
          <div className={styles.footerLabel}>Innlogget</div>
          <div className={styles.footerValue} title={user.email}>
            {user.name}
          </div>
          {user.role === "admin" ? (
            <div className={styles.footerNote}>Administrator</div>
          ) : null}
          <Button variant="link" onClick={onSignOut}>
            Logg ut
          </Button>
        </div>
      </div>
    </aside>
  );
}
