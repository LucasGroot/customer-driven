import { useEffect } from "react";
import { Card } from "../../components/Card";
import { PageIntro } from "../../components/PageIntro";
import type { AboutTopic } from "../../domain/aboutTopics";
import { AboutIcon } from "./AboutIcon";
import { ABOUT_INTRO, FAQ_SECTIONS, STEPS } from "./aboutContent";
import styles from "./AboutView.module.css";

const HIGHLIGHT_MS = 1600;

function questionId(topic: AboutTopic): string {
  return `om-analysen-${topic}`;
}

interface AboutViewProps {
  /** The question to open and scroll to, when the page is reached from an info bubble. */
  openTopic: AboutTopic | null;
}

export function AboutView({ openTopic }: AboutViewProps) {
  useEffect(() => {
    if (openTopic === null) return;
    const question = document.getElementById(questionId(openTopic));
    if (!(question instanceof HTMLDetailsElement)) return;
    question.open = true;
    // Focus follows, so a keyboard or screen reader user lands on the question too
    question.querySelector("summary")?.focus({ preventScroll: true });
    // The global reduced-motion rule does not reach scripted motion, so it is checked here
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    question.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    if (!reduceMotion) {
      question.animate([{ background: "var(--color-blue-100)" }, { background: "transparent" }], {
        duration: HIGHLIGHT_MS,
      });
    }
  }, [openTopic]);

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
              <details key={item.question} id={questionId(item.topic)} className={styles.question}>
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
