import { useEffect, useRef, type RefObject } from "react";

const APP_NAME = "Kunnskapsgap";

/**
 * Lets keyboard and screen reader users notice that the page changed. The
 * dashboard swaps pages without a page load, so neither the browser tab nor
 * the screen reader would otherwise say that anything happened.
 *
 * On every page change the tab gets the page's name, and focus moves to the
 * page heading, so the screen reader reads it and Tab continues from the top
 * of the new page instead of somewhere in the menu. The first page keeps
 * focus where the browser put it.
 *
 * `pageKey` changes whenever another page is shown. `keepFocus` is for a page
 * that moves focus itself, like "Om analysen" opened at one question.
 */
export function usePageFocus(
  mainRef: RefObject<HTMLElement | null>,
  pageKey: string,
  pageTitle: string,
  keepFocus: boolean,
) {
  const shownKey = useRef(pageKey);

  useEffect(() => {
    document.title = `${pageTitle} – ${APP_NAME}`;
  }, [pageTitle]);

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
