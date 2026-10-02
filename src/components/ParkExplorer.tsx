"use client";

import { useRef, type ReactNode } from "react";
import ParkDetails from "@/components/ParkDetails";
import ParkList from "@/components/ParkList";
import { ParksProvider } from "@/contexts/ParksContext";
import { useParks } from "@/hooks/useParks";
import { ExplorerLayout } from "@/layouts/ExplorerLayout";

// Tailwind only generates classes it finds as literal strings.
const RETRY_BUTTON_CLASS =
  "mt-3 rounded-md border border-green-800 bg-green-800 px-3 py-2 font-medium text-white hover:bg-green-900 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2";

/** A state message that stands in for the list; the map and details are hidden until there are parks. */
function Message({ children }: { children: ReactNode }) {
  return <div className="rounded-md border border-zinc-300 bg-white p-4 text-zinc-900">{children}</div>;
}

function ExplorerContent() {
  const { status, parks, error, selectedParkId, selectedPark, selectPark, retry } = useParks();
  // Handed to ParkDetails now so the focus hook can be attached to it when selection focus is wired in.
  const headingRef = useRef<HTMLHeadingElement>(null);

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

  return (
    <ExplorerLayout
      list={<ParkList parks={parks} selectedParkId={selectedParkId} onSelect={selectPark} />}
      map={null}
      details={<ParkDetails park={selectedPark} headingRef={headingRef} />}
    />
  );
}

/**
 * The client-side explorer: owns the fetch and selection state through ParksProvider and
 * shows loading, failure (with Retry), empty, or ready (list + details). The map and the
 * selection focus handoff are added in the next phase.
 */
export default function ParkExplorer() {
  return (
    <ParksProvider>
      <ExplorerContent />
    </ParksProvider>
  );
}
