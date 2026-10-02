import { useEffect, useRef, type RefObject } from "react";

function isFullyInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

/** jsdom has no matchMedia, so its absence means "no reduced-motion preference". */
function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Moves focus to the details heading each time `focusRequest` changes to a value
 * above 0, then scrolls it into view only if it is not already fully visible.
 *
 * It never acts on mount (a request already present at mount is ignored), so loading
 * the page changes neither focus nor scroll; a counter rather than the selected id
 * drives it, so re-selecting the same park refocuses. Focus is a side effect, so it
 * lives in an effect, not in render (https://react.dev/learn/synchronizing-with-effects).
 *
 * `scrollIntoView` and `matchMedia` are feature-checked because jsdom lacks both.
 */
export function useFocusOnSelect(
  headingRef: RefObject<HTMLElement | null>,
  focusRequest: number,
) {
  const handledRequest = useRef(focusRequest);

  useEffect(() => {
    if (focusRequest === handledRequest.current) return;
    handledRequest.current = focusRequest;
    if (focusRequest === 0) return;

    const heading = headingRef.current;
    if (!heading) return;

    // Focus without the browser's own jump, then scroll only when needed.
    heading.focus({ preventScroll: true });
    if (typeof heading.scrollIntoView !== "function" || isFullyInViewport(heading)) {
      return;
    }
    heading.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }, [focusRequest, headingRef]);
}
