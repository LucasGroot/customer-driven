import { useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AboutTopic } from "../domain/aboutTopics";
import { OpenAboutContext } from "./AboutLink";
import styles from "./InfoBubble.module.css";

const BUBBLE_WIDTH = 260;
const SCREEN_MARGIN = 12;
const GAP_BELOW_BUTTON = 8;

interface InfoBubbleProps {
  /** What the bubble explains, e.g. "Snittdekning". Names the button for screen readers. */
  subject: string;
  text: string;
  /** The question on "Om analysen" that "Les mer" opens. No link when omitted. */
  topic?: AboutTopic | undefined;
}

interface Position {
  top: number;
  left: number;
}

/**
 * The (i) next to a label. It opens a short explanation on click or Enter, with a
 * link to the full answer on "Om analysen". It is drawn on the page itself, so a
 * table that scrolls or clips its content cannot cut it off.
 */
export function InfoBubble({ subject, text, topic }: InfoBubbleProps) {
  const openAbout = useContext(OpenAboutContext);
  const [position, setPosition] = useState<Position | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const bubbleId = useId();
  const isOpen = position !== null;

  useEffect(() => {
    if (!isOpen) return;
    bubbleRef.current?.focus();

    const close = () => {
      setPosition(null);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (bubbleRef.current?.contains(target) === true || buttonRef.current?.contains(target) === true) return;
      close();
    };
    const closeAndReturn = () => {
      close();
      buttonRef.current?.focus();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAndReturn();
        return;
      }
      // The bubble sits at the end of the page, so tabbing out of it would leave
      // the table behind. Tabbing past either end returns to the (i) instead.
      const bubble = bubbleRef.current;
      if (event.key !== "Tab" || bubble === null || !bubble.contains(document.activeElement)) return;
      const link = bubble.querySelector("button");
      const movingToLink = !event.shiftKey && link !== null && document.activeElement === bubble;
      if (!movingToLink) {
        event.preventDefault();
        closeAndReturn();
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    // Capturing, so scrolling the table sideways closes it too
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [isOpen]);

  const toggle = () => {
    if (isOpen) {
      setPosition(null);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect === undefined) return;
    const furthestLeft = window.innerWidth - BUBBLE_WIDTH - SCREEN_MARGIN;
    setPosition({
      top: rect.bottom + GAP_BELOW_BUTTON,
      left: Math.max(SCREEN_MARGIN, Math.min(rect.left, furthestLeft)),
    });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        aria-label={`Mer om ${subject.toLowerCase()}`}
        aria-expanded={isOpen}
        aria-controls={isOpen ? bubbleId : undefined}
        onClick={toggle}
      >
        i
      </button>
      {position === null
        ? null
        : createPortal(
            <div
              ref={bubbleRef}
              id={bubbleId}
              role="dialog"
              aria-label={subject}
              className={styles.bubble}
              style={{ top: position.top, left: position.left, width: BUBBLE_WIDTH }}
              tabIndex={-1}
            >
              <p>{text}</p>
              {topic !== undefined && openAbout !== null ? (
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => {
                    setPosition(null);
                    openAbout(topic);
                  }}
                >
                  Les mer under «Om analysen»
                </button>
              ) : null}
            </div>,
            document.body,
          )}
    </>
  );
}
