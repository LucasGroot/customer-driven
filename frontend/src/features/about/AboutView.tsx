import { Card } from "../../components/Card";
import { PageIntro } from "../../components/PageIntro";
import { AboutIcon } from "./AboutIcon";
import { ABOUT_INTRO, FAQ_SECTIONS, STEPS } from "./aboutContent";
import styles from "./AboutView.module.css";

export function AboutView() {
  return (
    <section className={styles.view}>
      <PageIntro title="Om analysen" lead={ABOUT_INTRO} />

      <Card title="Hvordan fungerer analysen?">
        <div className={styles.steps}>
          {STEPS.map((step) => (
            <div key={step.title} className={styles.step}>
              <span className={styles.stepIcon}>
                <AboutIcon name={step.icon} />
              </span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </div>
          ))}
        </div>
      </Card>

      <h2 className={styles.faqHeading}>Ofte stilte spørsmål</h2>
      <div className={styles.sections}>
        {FAQ_SECTIONS.map((section) => (
          <section key={section.title} className={styles.section}>
            <header className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>
                <AboutIcon name={section.icon} />
              </span>
              <div>
                <h3 className={styles.sectionTitle}>{section.title}</h3>
                <p className={styles.sectionDescription}>{section.description}</p>
              </div>
            </header>
            {section.questions.map((item) => (
              <details key={item.question} className={styles.question}>
                <summary>
                  {item.question}
                  <AboutIcon name="chevron" className={styles.chevron} />
                </summary>
                <div className={styles.answer}>
                  {item.answer.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </details>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}
