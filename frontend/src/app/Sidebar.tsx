import { NAVIGATION, VIEWER_ROLES, isNavigationActive, type ViewName, type ViewerRole } from "./views";
import styles from "./Sidebar.module.css";
import { classNames } from "../components/classNames";

interface SidebarProps {
  currentView: ViewName;
  gapCount: number;
  lastRunLabel: string;
  ticketCount: number;
  routineCount: number;
  role: ViewerRole;
  onNavigate: (view: ViewName) => void;
  onRoleChange: (role: ViewerRole) => void;
}

export function Sidebar({
  currentView,
  gapCount,
  lastRunLabel,
  ticketCount,
  routineCount,
  role,
  onNavigate,
  onRoleChange,
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
        <div className={styles.footerSection}>
          <div className={styles.footerLabel}>Vis som (prototype)</div>
          <div className={styles.roleToggle} role="group" aria-label="Vis som">
            {VIEWER_ROLES.map((option) => {
              const selected = option.role === role;
              return (
                <button
                  key={option.role}
                  type="button"
                  className={
                    selected ? classNames(styles.roleButton, styles.roleSelected) : styles.roleButton
                  }
                  aria-pressed={selected}
                  onClick={() => {
                    onRoleChange(option.role);
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.footerSection}>
          <div className={styles.footerLabel}>Siste analyse</div>
          <div className={styles.footerValue}>{lastRunLabel}</div>
          <div className={styles.footerNote}>
            {ticketCount} henvendelser · {routineCount} rutiner
          </div>
        </div>

        <p className={styles.footerNote}>
          Eksempeldata. Ingen ekte henvendelser eller rutiner er brukt.
        </p>
      </div>
    </aside>
  );
}
