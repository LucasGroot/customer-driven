import { Button } from "../components/Button";
import { signIn, signOut } from "./msalConfig";
import styles from "./SignInView.module.css";

interface SignInViewProps {
  busy: boolean;
  failureMessage?: string;
}

export function SignInView({ busy, failureMessage }: SignInViewProps) {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.brand}>
          <h1 className={styles.brandName}>Kunnskapsgap</h1>
          <div className={styles.brandSubtitle}>ServiceNow × Kvaliteket</div>
        </div>

        {failureMessage === undefined ? (
          <>
            <p className={styles.lead}>
              Logg inn med jobbkontoen din i Trondheim kommune for å se kunnskapsgapene.
            </p>
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => {
                void signIn();
              }}
            >
              {busy ? "Logger inn …" : "Logg inn med Microsoft"}
            </Button>
          </>
        ) : (
          <>
            <p className={styles.failure} role="alert">
              {failureMessage}
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                void signOut();
              }}
            >
              Logg ut
            </Button>
          </>
        )}
      </section>
    </main>
  );
}
