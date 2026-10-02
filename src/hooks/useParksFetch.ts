import { useCallback, useEffect, useState } from "react";
import { fetchParks } from "@/lib/api";
import { normalizeParks } from "@/lib/parks";
import type { Park } from "@/lib/types";

export const FETCH_ERROR_MESSAGE =
  "Parks could not be loaded. Check your connection and try again.";

export type ParksStatus = "loading" | "ready" | "error";

interface ParksFetchState {
  status: ParksStatus;
  parks: Park[];
  error: string | null;
}

const LOADING_STATE: ParksFetchState = { status: "loading", parks: [], error: null };

function warnAboutDroppedRecords(count: number) {
  if (count > 0 && process.env.NODE_ENV !== "production") {
    console.warn(`[useParksFetch] dropped ${count} unusable park record(s)`);
  }
}

/**
 * Loads and normalizes the parks. Each effect run owns an AbortController that is
 * aborted on cleanup, so a superseded request (StrictMode's extra effect run, a
 * Retry while one is in flight, or unmount) can never apply its result.
 * Retry is user-initiated only.
 *
 * Source: https://react.dev/reference/react/useEffect ("Fetching data with Effects":
 * the cleanup-time `ignore` flag; here the aborted signal plays that role).
 */
export function useParksFetch() {
  const [state, setState] = useState<ParksFetchState>(LOADING_STATE);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    fetchParks(signal).then(
      (raw) => {
        if (signal.aborted) return;
        const parks = normalizeParks(raw);
        warnAboutDroppedRecords(raw.length - parks.length);
        setState({ status: "ready", parks, error: null });
      },
      (error: unknown) => {
        if (signal.aborted) return;
        console.error("[useParksFetch] failed to load parks:", error);
        setState({ status: "error", parks: [], error: FETCH_ERROR_MESSAGE });
      },
    );

    return () => controller.abort();
  }, [attempt]); // a new attempt re-runs the effect

  const retry = useCallback(() => {
    setState(LOADING_STATE);
    setAttempt((current) => current + 1);
  }, []);

  return { ...state, retry };
}
