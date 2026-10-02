export const PARKS_ENDPOINT = "/api/parks";
export const FETCH_TIMEOUT_MS = 10_000;

/**
 * Loads the raw parks array from the API. Rejects on a network error, a non-2xx
 * response, invalid JSON, a non-array body, the 10 s timeout, or when the caller's
 * signal aborts (immediately, without issuing a request, if it is already aborted).
 * Never retries, and error messages never include response text.
 *
 * The timeout is a setTimeout + AbortController (not AbortSignal.timeout) so tests
 * can drive it with fake timers.
 */
export async function fetchParks(signal?: AbortSignal): Promise<unknown[]> {
  signal?.throwIfAborted();

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error("Request timed out")),
    FETCH_TIMEOUT_MS,
  );
  const abortFromCaller = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    const response = await fetch(PARKS_ENDPOINT, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const body: unknown = await response.json();
    if (!Array.isArray(body)) {
      throw new Error("Unexpected response shape");
    }
    return body;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}
