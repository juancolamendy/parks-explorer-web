"use client";

import { divIcon } from "leaflet";
import type { DivIcon, LeafletEventHandlerFnMap, LeafletKeyboardEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { getMapView } from "@/lib/mapView";
import type { MapView } from "@/lib/mapView";
import { getMarkerParks } from "@/lib/parks";
import type { Park } from "@/lib/types";

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const TILE_FAILURE_NOTICE = "Map tiles could not be loaded. The list and details still work.";

// Tailwind only generates classes it finds as literal strings, so these stay whole.
const PIN_CLASS = "block h-6 w-6 rounded-full border-2 border-white bg-green-700 shadow-md";
const PIN_SELECTED_CLASS =
  "block h-8 w-8 rounded-full border-2 border-white bg-green-900 shadow-md ring-4 ring-amber-400";

interface ParkMapProps {
  parks: Park[];
  selectedParkId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Builds the marker as a DOM element, never an HTML string: park names come from
 * untrusted data, and `textContent` cannot be interpreted as markup.
 * Leaflet (1.9.4) accepts an Element for `divIcon` `html`.
 * The hidden text is the marker's accessible name; the pin differs by size and ring,
 * not colour alone, when selected.
 */
function createMarkerIcon(name: string, selected: boolean): DivIcon {
  const root = document.createElement("span");
  root.className = "flex h-full w-full items-center justify-center";

  const pin = document.createElement("span");
  pin.className = selected ? PIN_SELECTED_CLASS : PIN_CLASS;
  pin.dataset.selected = String(selected);

  const label = document.createElement("span");
  label.className = "sr-only";
  label.textContent = selected ? `${name} (selected)` : name;

  root.append(pin, label);
  return divIcon({ className: "", html: root, iconSize: [32, 32], iconAnchor: [16, 16] });
}

function viewOptions(view: MapView) {
  return view.kind === "bounds"
    ? { bounds: view.bounds, boundsOptions: { padding: view.padding, maxZoom: view.maxZoom } }
    : { center: view.center, zoom: view.zoom };
}

interface ParkMarkerProps {
  park: Park;
  selected: boolean;
  onSelect: (id: string) => void;
}

function ParkMarker({ park, selected, onSelect }: ParkMarkerProps) {
  const icon = useMemo(() => createMarkerIcon(park.name, selected), [park.name, selected]);

  // Leaflet 1.9.4 turns neither Enter nor Space on a marker into a click (only bound popups
  // react to Enter), so the keys are handled on the layer's own `keydown` event.
  const handlers = useMemo<LeafletEventHandlerFnMap>(
    () => ({
      click: () => onSelect(park.id),
      keydown: (event) => {
        const keyboardEvent = (event as LeafletKeyboardEvent).originalEvent;
        if (keyboardEvent.key !== "Enter" && keyboardEvent.key !== " ") return;
        keyboardEvent.preventDefault();
        onSelect(park.id);
      },
    }),
    [park.id, onSelect],
  );

  if (!park.coordinates) return null;
  return (
    <Marker
      position={[park.coordinates.lat, park.coordinates.lng]}
      icon={icon}
      title={park.name}
      eventHandlers={handlers}
      zIndexOffset={selected ? 1000 : 0}
    />
  );
}

export default function ParkMap({ parks, selectedParkId, onSelect }: ParkMapProps) {
  const [tilesFailed, setTilesFailed] = useState(false);

  const markerParks = useMemo(() => getMarkerParks(parks), [parks]);
  const view = useMemo(
    () =>
      getMapView(markerParks.flatMap((park) => (park.coordinates ? [park.coordinates] : []))),
    [markerParks],
  );
  // `tileerror` fires once per failed tile; the flag keeps it to a single notice.
  const tileHandlers = useMemo<LeafletEventHandlerFnMap>(
    () => ({ tileerror: () => setTilesFailed(true) }),
    [],
  );

  return (
    <section aria-label="Parks map">
      <div className="h-72 w-full overflow-hidden rounded-lg border border-zinc-300 lg:h-96">
        {/* MapContainer view props are immutable after the first render, so a new view remounts it. */}
        <MapContainer key={JSON.stringify(view)} className="h-full w-full" {...viewOptions(view)}>
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} eventHandlers={tileHandlers} />
          {markerParks.map((park) => (
            <ParkMarker
              key={park.id}
              park={park}
              selected={park.id === selectedParkId}
              onSelect={onSelect}
            />
          ))}
        </MapContainer>
      </div>
      {tilesFailed && (
        <p
          role="status"
          className="mt-2 rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900"
        >
          {TILE_FAILURE_NOTICE}
        </p>
      )}
    </section>
  );
}
