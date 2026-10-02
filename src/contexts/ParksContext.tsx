"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useParksFetch, type ParksStatus } from "@/hooks/useParksFetch";
import type { Park } from "@/lib/types";

export interface ParksContextValue {
  parks: Park[];
  status: ParksStatus;
  error: string | null;
  /** The single selected-park id that drives the list, the map, and the details panel. */
  selectedParkId: string | null;
  /** Derived from `selectedParkId` and `parks` on every change; never stored. */
  selectedPark: Park | undefined;
  /** Incremented on every `selectPark` call (even for the same id) so focus can be re-requested. */
  focusRequest: number;
  selectPark: (id: string) => void;
  retry: () => void;
}

// Source: https://nextjs.org/docs (Server and Client Components > Context providers): context lives in a
// "use client" file. React 19 lets the context itself be rendered as the provider.
export const ParksContext = createContext<ParksContextValue | null>(null);

interface Selection {
  id: string | null;
  focusRequest: number;
}

const NO_SELECTION: Selection = { id: null, focusRequest: 0 };

/** Owns the fetch state and the selection: the one source of truth for the explorer. */
export function ParksProvider({ children }: { children: ReactNode }) {
  const { status, parks, error, retry } = useParksFetch();
  const [selection, setSelection] = useState<Selection>(NO_SELECTION);

  const selectPark = useCallback((id: string) => {
    setSelection((current) => ({ id, focusRequest: current.focusRequest + 1 }));
  }, []);

  const value = useMemo<ParksContextValue>(
    () => ({
      parks,
      status,
      error,
      selectedParkId: selection.id,
      selectedPark:
        selection.id === null
          ? undefined
          : parks.find((park) => park.id === selection.id),
      focusRequest: selection.focusRequest,
      selectPark,
      retry,
    }),
    [parks, status, error, selection, selectPark, retry],
  );

  return <ParksContext value={value}>{children}</ParksContext>;
}
