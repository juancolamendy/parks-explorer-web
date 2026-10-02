import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchParks } from "@/lib/api";

/** A fetch that never answers on its own but rejects when its signal aborts. */
function pendingFetch() {
  return vi.fn(
    (_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        signal?.addEventListener(
          "abort",
          () => reject(signal.reason ?? new Error("aborted")),
          { once: true },
        );
      }),
  );
}

function stubFetchResponse(response: Response) {
  const fetchMock = vi.fn(() => Promise.resolve(response));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("[DES-017][AC-009] fetchParks failure matrix", () => {
  it("[TEST-006][AC-009][DES-017][TASK-003] resolves with the array and requests /api/parks without caching", async () => {
    // Arrange
    const body = [{ id: "a" }, { id: "b" }];
    const fetchMock = stubFetchResponse(new Response(JSON.stringify(body)));

    // Act
    const result = await fetchParks();

    // Assert
    expect(result).toEqual(body);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/parks");
    expect(init.cache).toBe("no-store");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("[TEST-006][AC-009][DES-017][TASK-003] resolves an empty array as an empty array", async () => {
    // Arrange
    stubFetchResponse(new Response("[]"));

    // Act
    const result = await fetchParks();

    // Assert
    expect(result).toEqual([]);
  });

  it.each([
    ["a 500 response", new Response("boom", { status: 500 })],
    ["a 404 response", new Response("missing", { status: 404 })],
    ["a 503 response with a valid array body", new Response("[]", { status: 503 })],
    [
      "a 404 response with a valid non-empty array body",
      new Response('[{"id":"a"}]', { status: 404 }),
    ],
    ["a 200 response with invalid JSON", new Response("not json")],
    ["a 200 response with a JSON object", new Response('{"id":"a"}')],
    ["a 200 response with JSON null", new Response("null")],
  ])(
    "[TEST-006][AC-009][DES-017][TASK-003] rejects on %s",
    async (_label, response) => {
      // Arrange
      stubFetchResponse(response);

      // Act / Assert
      await expect(fetchParks()).rejects.toThrow();
    },
  );

  it("[TEST-006][AC-009][DES-017][TASK-003] rejects on a network error", async () => {
    // Arrange
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("fetch failed"))));

    // Act / Assert
    await expect(fetchParks()).rejects.toThrow("fetch failed");
  });

  it("[TEST-006][AC-009][DES-017][TASK-003] does not leak the response body into the error message", async () => {
    // Arrange
    stubFetchResponse(new Response("secret-internal-detail", { status: 500 }));

    // Act
    const failure = fetchParks().then(
      () => null,
      (error: Error) => error,
    );

    // Assert
    const error = await failure;
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).not.toContain("secret-internal-detail");
  });
});

describe("[DES-017][AC-009] fetchParks timeout and cancellation", () => {
  it("[TEST-007][AC-009][DES-017][TASK-003] aborts the request and rejects after 10 seconds", async () => {
    // Arrange
    vi.useFakeTimers();
    const fetchMock = pendingFetch();
    vi.stubGlobal("fetch", fetchMock);
    const rejection = expect(fetchParks()).rejects.toThrow();

    // Act
    await vi.advanceTimersByTimeAsync(9_999);
    const signal = fetchMock.mock.calls[0][1]?.signal;
    const abortedEarly = signal?.aborted;
    await vi.advanceTimersByTimeAsync(1);

    // Assert
    expect(abortedEarly).toBe(false);
    await rejection;
    expect(signal?.aborted).toBe(true);
  });

  it("[TEST-007][AC-009][DES-017][TASK-003] aborts the request when the caller aborts", async () => {
    // Arrange
    vi.useFakeTimers();
    const fetchMock = pendingFetch();
    vi.stubGlobal("fetch", fetchMock);
    const caller = new AbortController();
    const rejection = expect(fetchParks(caller.signal)).rejects.toThrow();

    // Act
    caller.abort();

    // Assert
    await rejection;
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it("[TEST-007][AC-009][DES-017][TASK-003] rejects immediately when the caller's signal is already aborted", async () => {
    // Arrange
    vi.useFakeTimers();
    const fetchMock = pendingFetch();
    vi.stubGlobal("fetch", fetchMock);
    const caller = new AbortController();
    caller.abort();

    // Act / Assert
    await expect(fetchParks(caller.signal)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("[TEST-007][AC-009][DES-017][TASK-003] leaves no timer pending after success, failure, or abort", async () => {
    // Arrange
    vi.useFakeTimers();
    stubFetchResponse(new Response("[]"));
    await fetchParks();
    const afterSuccess = vi.getTimerCount();

    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("down"))));
    await fetchParks().catch(() => undefined);
    const afterFailure = vi.getTimerCount();

    const fetchMock = pendingFetch();
    vi.stubGlobal("fetch", fetchMock);
    const caller = new AbortController();
    const rejection = fetchParks(caller.signal).catch(() => undefined);
    caller.abort();
    await rejection;
    const afterAbort = vi.getTimerCount();

    // Assert
    expect([afterSuccess, afterFailure, afterAbort]).toEqual([0, 0, 0]);
  });
});
