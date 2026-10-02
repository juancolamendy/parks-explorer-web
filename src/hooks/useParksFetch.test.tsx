/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sample from "@/data/parks.sample.json";
import { FETCH_ERROR_MESSAGE, useParksFetch } from "@/hooks/useParksFetch";
import { fetchParks } from "@/lib/api";
import { makeRawPark } from "@/lib/fixtures/makePark";
import { normalizeParks } from "@/lib/parks";

vi.mock(import("@/lib/api"), () => ({ fetchParks: vi.fn() }));

const fetchParksMock = vi.mocked(fetchParks);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const signalOfCall = (index: number) => fetchParksMock.mock.calls[index][0];

let errorSpy: ReturnType<typeof vi.spyOn>;
let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchParksMock.mockReset();
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("[DES-008][AC-009] loading, ready, error, and retry", () => {
  it("[TEST-008][AC-009][DES-008][TASK-004] starts in loading with no parks and no error", () => {
    // Arrange
    fetchParksMock.mockReturnValue(new Promise(() => undefined));

    // Act
    const { result } = renderHook(() => useParksFetch());

    // Assert
    expect(result.current.status).toBe("loading");
    expect(result.current.parks).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("[TEST-008][AC-009][DES-008][TASK-004] becomes ready with the normalized parks", async () => {
    // Arrange
    fetchParksMock.mockResolvedValue(sample);

    // Act
    const { result } = renderHook(() => useParksFetch());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    // Assert
    expect(result.current.parks.map((park) => park.id)).toEqual(
      normalizeParks(sample).map((park) => park.id),
    );
    expect(result.current.parks).toHaveLength(12);
    expect(result.current.error).toBeNull();
  });

  it("[TEST-008][AC-009][DES-008][TASK-004] shows a user-safe error and logs the failure", async () => {
    // Arrange
    fetchParksMock.mockRejectedValue(new Error("secret-internal-detail"));

    // Act
    const { result } = renderHook(() => useParksFetch());
    await waitFor(() => expect(result.current.status).toBe("error"));

    // Assert
    expect(result.current.error).toBe(FETCH_ERROR_MESSAGE);
    expect(result.current.error).not.toContain("secret-internal-detail");
    expect(result.current.parks).toEqual([]);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("[TEST-008][AC-009][DES-008][TASK-004] retry goes back to loading, clears the error, and recovers", async () => {
    // Arrange
    const second = deferred<unknown[]>();
    fetchParksMock
      .mockRejectedValueOnce(new Error("down"))
      .mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useParksFetch());
    await waitFor(() => expect(result.current.status).toBe("error"));

    // Act
    act(() => result.current.retry());

    // Assert
    expect(result.current.status).toBe("loading");
    expect(result.current.error).toBeNull();
    await act(async () => second.resolve(sample));
    expect(result.current.status).toBe("ready");
    expect(result.current.parks).toHaveLength(12);
    expect(fetchParksMock).toHaveBeenCalledTimes(2);
  });
});

describe("[DES-008][AC-009] race conditions", () => {
  it("[TEST-009][AC-009][DES-008][TASK-004] under StrictMode only the latest request's result is applied", async () => {
    // Arrange
    const first = deferred<unknown[]>();
    const second = deferred<unknown[]>();
    fetchParksMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    // Act
    const { result } = renderHook(() => useParksFetch(), { reactStrictMode: true });

    // Assert
    expect(fetchParksMock).toHaveBeenCalledTimes(2);
    expect(signalOfCall(0)?.aborted).toBe(true);
    expect(signalOfCall(1)?.aborted).toBe(false);

    await act(async () => first.resolve(sample));
    expect(result.current.status).toBe("loading");
    expect(result.current.parks).toEqual([]);

    await act(async () => second.resolve([makeRawPark()]));
    expect(result.current.status).toBe("ready");
    expect(result.current.parks.map((park) => park.id)).toEqual(["prospect-park"]);
  });

  it("[TEST-009][AC-009][DES-008][TASK-004] unmount aborts the request and a late result changes nothing", async () => {
    // Arrange
    const pending = deferred<unknown[]>();
    fetchParksMock.mockReturnValue(pending.promise);
    const { result, unmount } = renderHook(() => useParksFetch());

    // Act
    unmount();
    await act(async () => pending.resolve(sample));

    // Assert
    expect(signalOfCall(0)?.aborted).toBe(true);
    expect(result.current.status).toBe("loading");
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("[TEST-009][AC-009][DES-008][TASK-004] retry while a request is in flight aborts it and ignores its late result", async () => {
    // Arrange
    const first = deferred<unknown[]>();
    const second = deferred<unknown[]>();
    fetchParksMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useParksFetch());

    // Act
    act(() => result.current.retry());

    // Assert
    expect(fetchParksMock).toHaveBeenCalledTimes(2);
    expect(signalOfCall(0)?.aborted).toBe(true);

    await act(async () => first.resolve(sample));
    expect(result.current.status).toBe("loading");

    await act(async () => second.resolve([makeRawPark({}, "riverside-commons")]));
    expect(result.current.status).toBe("ready");
    expect(result.current.parks.map((park) => park.id)).toEqual(["riverside-commons"]);
  });

  it("[TEST-009][AC-009][DES-008][TASK-004] a late failure from a superseded request does not produce an error", async () => {
    // Arrange
    const first = deferred<unknown[]>();
    const second = deferred<unknown[]>();
    fetchParksMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useParksFetch());
    act(() => result.current.retry());

    // Act
    await act(async () => first.reject(new Error("late failure")));
    await act(async () => second.resolve(sample));

    // Assert
    expect(result.current.status).toBe("ready");
    expect(result.current.error).toBeNull();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

describe("[DES-008][AC-015] empty and unusable data", () => {
  it("[TEST-010][AC-015][DES-008][TASK-004] an empty array is ready with no parks, not an error", async () => {
    // Arrange
    fetchParksMock.mockResolvedValue([]);

    // Act
    const { result } = renderHook(() => useParksFetch());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    // Assert
    expect(result.current.parks).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("[TEST-010][AC-015][DES-008][TASK-004] an all-invalid array is ready with no parks and warns with the dropped count", async () => {
    // Arrange
    fetchParksMock.mockResolvedValue([{ id: "", name: "No id" }, { name: "x" }, null]);

    // Act
    const { result } = renderHook(() => useParksFetch());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    // Assert
    expect(result.current.parks).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain("3");
  });

  it("[TEST-010][AC-015][DES-008][TASK-004] a repeated id is dropped with a count of 1 and clean data does not warn", async () => {
    // Arrange
    fetchParksMock.mockResolvedValueOnce([...sample, makeRawPark()]);
    const withDuplicate = renderHook(() => useParksFetch());
    await waitFor(() => expect(withDuplicate.result.current.status).toBe("ready"));

    // Assert
    expect(withDuplicate.result.current.parks).toHaveLength(12);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain("1");

    // Arrange / Act (clean data)
    warnSpy.mockClear();
    fetchParksMock.mockResolvedValueOnce(sample);
    const clean = renderHook(() => useParksFetch());
    await waitFor(() => expect(clean.result.current.status).toBe("ready"));

    // Assert
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
