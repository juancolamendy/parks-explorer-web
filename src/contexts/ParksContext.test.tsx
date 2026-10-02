/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sample from "@/data/parks.sample.json";
import { ParksProvider } from "@/contexts/ParksContext";
import { useParks } from "@/hooks/useParks";
import { useParksFetch } from "@/hooks/useParksFetch";
import { normalizeParks } from "@/lib/parks";
import type { Park } from "@/lib/types";

vi.mock(import("@/hooks/useParksFetch"), () => ({
  useParksFetch: vi.fn(),
}));

const useParksFetchMock = vi.mocked(useParksFetch);
const retryMock = vi.fn();
const sampleParks = normalizeParks(sample);

/** Mimics the real hook: a fresh object on every render, stable fields inside. */
function mockFetchState(
  state: { status: "loading" | "ready" | "error"; parks: Park[]; error: string | null },
) {
  useParksFetchMock.mockImplementation(() => ({ ...state, retry: retryMock }));
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <ParksProvider>{children}</ParksProvider>
);

beforeEach(() => {
  useParksFetchMock.mockReset();
  retryMock.mockReset();
  mockFetchState({ status: "ready", parks: sampleParks, error: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("[DES-015][AC-001] provider state", () => {
  it("[TEST-017][AC-001][DES-015][TASK-007] starts with nothing selected and no focus request", () => {
    // Arrange / Act
    const { result } = renderHook(() => useParks(), { wrapper });

    // Assert
    expect(result.current.selectedParkId).toBeNull();
    expect(result.current.selectedPark).toBeUndefined();
    expect(result.current.focusRequest).toBe(0);
    expect(result.current.status).toBe("ready");
    expect(result.current.parks).toHaveLength(12);
  });

  it("[TEST-017][AC-001][DES-015][TASK-007] selecting a park sets the id, derives the park, and requests focus", () => {
    // Arrange
    const { result } = renderHook(() => useParks(), { wrapper });

    // Act
    act(() => result.current.selectPark("prospect-park"));

    // Assert
    expect(result.current.selectedParkId).toBe("prospect-park");
    expect(result.current.selectedPark?.name).toBe("Prospect Park");
    expect(result.current.focusRequest).toBe(1);
  });

  it("[TEST-017][AC-012][DES-015][TASK-007] every selection increments the focus request, including re-selecting the same park", () => {
    // Arrange
    const { result } = renderHook(() => useParks(), { wrapper });

    // Act
    act(() => result.current.selectPark("prospect-park"));
    act(() => result.current.selectPark("prospect-park"));
    act(() => result.current.selectPark("riverside-commons"));

    // Assert
    expect(result.current.selectedParkId).toBe("riverside-commons");
    expect(result.current.focusRequest).toBe(3);
  });

  it("[TEST-017][AC-001][DES-015][TASK-007] an unknown id keeps the id but derives no park, and still requests focus", () => {
    // Arrange
    const { result } = renderHook(() => useParks(), { wrapper });

    // Act
    act(() => result.current.selectPark("no-such-park"));

    // Assert
    expect(result.current.selectedParkId).toBe("no-such-park");
    expect(result.current.selectedPark).toBeUndefined();
    expect(result.current.focusRequest).toBe(1);
  });

  it("[TEST-017][AC-001][DES-015][TASK-007] derives the selected park from the current parks instead of storing it", () => {
    // Arrange
    const { result, rerender } = renderHook(() => useParks(), { wrapper });
    act(() => result.current.selectPark("prospect-park"));
    expect(result.current.selectedPark?.id).toBe("prospect-park");

    // Act
    mockFetchState({
      status: "ready",
      parks: sampleParks.filter((park) => park.id !== "prospect-park"),
      error: null,
    });
    rerender();

    // Assert
    expect(result.current.selectedParkId).toBe("prospect-park");
    expect(result.current.selectedPark).toBeUndefined();
  });

  it("[TEST-017][AC-001][DES-015][TASK-007] passes the loading and error state and retry through from the fetch hook", () => {
    // Arrange
    mockFetchState({ status: "error", parks: [], error: "fetch error" });

    // Act
    const { result } = renderHook(() => useParks(), { wrapper });
    act(() => result.current.retry());

    // Assert
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("fetch error");
    expect(result.current.parks).toEqual([]);
    expect(retryMock).toHaveBeenCalledTimes(1);
  });
});

describe("[DES-007] provider contract", () => {
  it("[TEST-018][DES-007][TASK-007] useParks throws a descriptive error outside a ParksProvider", () => {
    // Arrange: React logs the thrown render error; keep the output quiet
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    // Act / Assert
    expect(() => renderHook(() => useParks())).toThrow(/ParksProvider/);
  });

  it("[TEST-018][DES-007][TASK-007] keeps the context value identity across unrelated re-renders", () => {
    // Arrange
    const { result, rerender } = renderHook(() => useParks(), { wrapper });
    const firstValue = result.current;

    // Act
    rerender();
    rerender();

    // Assert
    expect(result.current).toBe(firstValue);
  });

  it("[TEST-018][DES-007][TASK-007] keeps selectPark stable while the value changes only when state changes", () => {
    // Arrange
    const { result } = renderHook(() => useParks(), { wrapper });
    const firstValue = result.current;
    const firstSelectPark = result.current.selectPark;

    // Act
    act(() => result.current.selectPark("prospect-park"));

    // Assert
    expect(result.current).not.toBe(firstValue);
    expect(result.current.selectPark).toBe(firstSelectPark);
  });
});
