import { useEffect, useRef, type RefObject } from "react";

/**
 * Lets keyboard and screen reader users notice that the page changed. The
 * dashboard swaps pages without a page load, so the screen reader would
 * otherwise not say that anything happened.
 *
 * On every page change focus moves to the page heading, so the screen reader
 * reads it and Tab continues from the top of the new page instead of somewhere
 * in the menu. The first page keeps focus where the browser put it. The browser
 * tab always says "Kunnskapsgap", whichever page is shown.
 *
 * `pageKey` changes whenever another page is shown. `keepFocus` is for a page
 * that moves focus itself, like "Om analysen" opened at one question.
 */
export function usePageFocus(
  mainRef: RefObject<HTMLElement | null>,
  pageKey: string,
  keepFocus: boolean,
) {
  const shownKey = useRef(pageKey);

  useEffect(() => {
    if (shownKey.current === pageKey) return;
    shownKey.current = pageKey;
    if (keepFocus) return;
    const heading = mainRef.current?.querySelector("h1");
    if (heading instanceof HTMLElement) {
      heading.focus();
    } else {
      mainRef.current?.focus();
    }
  }, [mainRef, pageKey, keepFocus]);
}
