"use client";

import dynamic from "next/dynamic";
import { useRef, type ReactNode } from "react";
import ParkDetails from "@/components/ParkDetails";
import ParkList from "@/components/ParkList";
import { ParksProvider } from "@/contexts/ParksContext";
import { useFocusOnSelect } from "@/hooks/useFocusOnSelect";
import { useParks } from "@/hooks/useParks";
import { ExplorerLayout } from "@/layouts/ExplorerLayout";

// Tailwind only generates classes it finds as literal strings.
const RETRY_BUTTON_CLASS =
  "mt-3 rounded-md border border-green-800 bg-green-800 px-3 py-2 font-medium text-white hover:bg-green-900 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2";

/**
 * Same box as the real map (ParkMap uses h-72, lg:h-96), so nothing shifts when it arrives.
 * Source: https://nextjs.org/docs/app/guides/lazy-loading (`loading` option of next/dynamic).
 */
function MapPlaceholder() {
  return (
    <section aria-label="Parks map" aria-busy="true">
      <div className="flex h-72 w-full items-center justify-center rounded-lg border border-zinc-300 bg-zinc-100 text-zinc-700 lg:h-96">
        Loading map…
      </div>
    </section>
  );
}

// Leaflet touches `window` when it loads, so the map is a client-only chunk: `ssr: false` is
// only allowed in a Client Component (this file) and keeps Leaflet out of the server render.
// Source: https://nextjs.org/docs/app/guides/lazy-loading (Skipping SSR).
const ParkMap = dynamic(() => import("@/components/ParkMap"), {
  ssr: false,
  loading: () => <MapPlaceholder />,
});

/** A state message that stands in for the list; the map and details are hidden until there are parks. */
function Message({ children }: { children: ReactNode }) {
  return <div className="rounded-md border border-zinc-300 bg-white p-4 text-zinc-900">{children}</div>;
}

function ExplorerContent() {
  const { status, parks, error, selectedParkId, selectedPark, focusRequest, selectPark, retry } =
    useParks();
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Called before any early return so the hook order never changes; it does nothing while the
  // details heading is not on screen (loading, failure, empty) or while no park has been chosen.
  useFocusOnSelect(headingRef, focusRequest);

  if (status === "loading") {
    return (
      <ExplorerLayout
        list={<div role="status"><Message>Loading parks…</Message></div>}
        map={null}
        details={null}
      />
    );
  }

  if (status === "error") {
    return (
      <ExplorerLayout
        list={
          <div role="alert">
            <Message>
              <p>{error}</p>
              <button type="button" className={RETRY_BUTTON_CLASS} onClick={retry}>
                Retry
              </button>
            </Message>
          </div>
        }
        map={null}
        details={null}
      />
    );
  }

  if (parks.length === 0) {
    return (
      <ExplorerLayout list={<Message>No parks available.</Message>} map={null} details={null} />
    );
  }

  // The map mounts only here, once the data is ready, so its initial view is already correct
  // (react-leaflet fixes the view props at first render).
  return (
    <ExplorerLayout
      list={<ParkList parks={parks} selectedParkId={selectedParkId} onSelect={selectPark} />}
      map={<ParkMap parks={parks} selectedParkId={selectedParkId} onSelect={selectPark} />}
      details={<ParkDetails park={selectedPark} headingRef={headingRef} />}
    />
  );
}

/**
 * The client-side explorer: owns the fetch and selection state through ParksProvider and
 * shows loading, failure (with Retry), empty, or ready (list + client-only map + details).
 * Selecting a park, from the list or a marker, moves focus to the details heading.
 */
export default function ParkExplorer() {
  return (
    <ParksProvider>
      <ExplorerContent />
    </ParksProvider>
  );
}
