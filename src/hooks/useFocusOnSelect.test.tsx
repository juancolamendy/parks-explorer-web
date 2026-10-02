/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import type { RefObject } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFocusOnSelect } from "@/hooks/useFocusOnSelect";

let heading: HTMLHeadingElement;

function setRect(
  element: HTMLElement,
  rect: { top: number; bottom: number; left?: number; right?: number },
) {
  const { top, bottom, left = 0, right = 100 } = rect;
  element.getBoundingClientRect = () =>
    ({
      top,
      bottom,
      left,
      right,
      width: right - left,
      height: bottom - top,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
}

function mountHook(initialRequest: number, options?: { reactStrictMode?: boolean }) {
  const ref: RefObject<HTMLElement | null> = { current: heading };
  return renderHook(({ request }) => useFocusOnSelect(ref, request), {
    initialProps: { request: initialRequest },
    ...options,
  });
}

beforeEach(() => {
  heading = document.createElement("h2");
  heading.tabIndex = -1;
  document.body.appendChild(heading);
  setRect(heading, { top: 10, bottom: 50 });
});

afterEach(() => {
  heading.remove();
  vi.unstubAllGlobals();
});

describe("[DES-009][AC-005] focusing the details heading", () => {
  it("[TEST-019][AC-005][DES-009][TASK-008] does not focus on mount when the request is 0", () => {
    // Arrange / Act
    mountHook(0);

    // Assert
    expect(document.activeElement).toBe(document.body);
  });

  it("[TEST-019][AC-005][DES-009][TASK-008] focuses the heading when the request changes to 1", () => {
    // Arrange
    const { rerender } = mountHook(0);

    // Act
    rerender({ request: 1 });

    // Assert
    expect(document.activeElement).toBe(heading);
  });

  it("[TEST-019][AC-005][DES-009][TASK-008] focuses the heading again on a new request after focus moved away", () => {
    // Arrange
    const { rerender } = mountHook(0);
    rerender({ request: 1 });
    heading.blur();
    expect(document.activeElement).toBe(document.body);

    // Act
    rerender({ request: 2 });

    // Assert
    expect(document.activeElement).toBe(heading);
  });

  it("[TEST-019][AC-005][DES-009][TASK-008] does not steal focus on mount even when the request is already above 0", () => {
    // Arrange / Act
    mountHook(3);

    // Assert
    expect(document.activeElement).toBe(document.body);
  });

  it("[TEST-019][AC-005][DES-009][TASK-008] does not refocus when re-rendered with the same request", () => {
    // Arrange
    const { rerender } = mountHook(0);
    rerender({ request: 1 });
    heading.blur();

    // Act
    rerender({ request: 1 });

    // Assert
    expect(document.activeElement).toBe(document.body);
  });

  it("[TEST-019][AC-005][DES-009][TASK-008] does not focus when the request goes back to 0", () => {
    // Arrange
    const { rerender } = mountHook(0);
    rerender({ request: 1 });
    heading.blur();

    // Act
    rerender({ request: 0 });

    // Assert
    expect(document.activeElement).toBe(document.body);
  });

  it("[TEST-019][AC-005][DES-009][TASK-008] under StrictMode stays quiet on mount and focuses once per new request", () => {
    // Arrange
    const focusSpy = vi.spyOn(heading, "focus");
    const { rerender } = mountHook(0, { reactStrictMode: true });
    expect(focusSpy).not.toHaveBeenCalled();

    // Act
    rerender({ request: 1 });

    // Assert
    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(heading);
  });
});

describe("[DES-009] scroll rules and environment guards", () => {
  it("[TEST-020][DES-009][TASK-008] scrolls smoothly to the top of the heading when it is off-screen", () => {
    // Arrange
    setRect(heading, { top: 900, bottom: 940 });
    const scrollIntoView = vi.fn();
    heading.scrollIntoView = scrollIntoView;
    const { rerender } = mountHook(0);

    // Act
    rerender({ request: 1 });

    // Assert
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("[TEST-020][DES-009][TASK-008] scrolls when the heading is only partly visible", () => {
    // Arrange
    setRect(heading, { top: 740, bottom: 800 });
    const scrollIntoView = vi.fn();
    heading.scrollIntoView = scrollIntoView;
    const { rerender } = mountHook(0);

    // Act
    rerender({ request: 1 });

    // Assert
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("[TEST-020][DES-009][TASK-008] does not scroll when the heading is already fully visible", () => {
    // Arrange
    setRect(heading, { top: 20, bottom: 60 });
    const scrollIntoView = vi.fn();
    heading.scrollIntoView = scrollIntoView;
    const { rerender } = mountHook(0);

    // Act
    rerender({ request: 1 });

    // Assert
    expect(document.activeElement).toBe(heading);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("[TEST-020][DES-009][TASK-008] uses instant scrolling under prefers-reduced-motion", () => {
    // Arrange
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({ matches: query.includes("reduce") })),
    );
    setRect(heading, { top: 900, bottom: 940 });
    const scrollIntoView = vi.fn();
    heading.scrollIntoView = scrollIntoView;
    const { rerender } = mountHook(0);

    // Act
    rerender({ request: 1 });

    // Assert
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  });

  it("[TEST-020][DES-009][TASK-008] keeps smooth scrolling when reduced motion is not requested", () => {
    // Arrange
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false })),
    );
    setRect(heading, { top: 900, bottom: 940 });
    const scrollIntoView = vi.fn();
    heading.scrollIntoView = scrollIntoView;
    const { rerender } = mountHook(0);

    // Act
    rerender({ request: 1 });

    // Assert
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("[TEST-020][DES-009][TASK-008] does not throw where matchMedia is missing (jsdom) and falls back to smooth", () => {
    // Arrange
    expect(typeof window.matchMedia).toBe("undefined");
    setRect(heading, { top: 900, bottom: 940 });
    const scrollIntoView = vi.fn();
    heading.scrollIntoView = scrollIntoView;
    const { rerender } = mountHook(0);

    // Act / Assert
    expect(() => rerender({ request: 1 })).not.toThrow();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("[TEST-020][DES-009][TASK-008] still focuses and does not throw where scrollIntoView is missing (jsdom)", () => {
    // Arrange
    expect(typeof heading.scrollIntoView).toBe("undefined");
    setRect(heading, { top: 900, bottom: 940 });
    const { rerender } = mountHook(0);

    // Act / Assert
    expect(() => rerender({ request: 1 })).not.toThrow();
    expect(document.activeElement).toBe(heading);
  });

  it("[TEST-020][DES-009][TASK-008] does nothing and does not throw when the ref is empty", () => {
    // Arrange
    const emptyRef: RefObject<HTMLElement | null> = { current: null };
    const { rerender } = renderHook(({ request }) => useFocusOnSelect(emptyRef, request), {
      initialProps: { request: 0 },
    });

    // Act / Assert
    expect(() => rerender({ request: 1 })).not.toThrow();
    expect(document.activeElement).toBe(document.body);
  });
});
