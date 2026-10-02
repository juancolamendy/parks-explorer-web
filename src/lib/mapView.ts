import type { Coordinates } from "@/lib/types";

type LatLngTuple = [lat: number, lng: number];

export type MapView =
  | { kind: "world"; center: LatLngTuple; zoom: number }
  | { kind: "point"; center: LatLngTuple; zoom: number }
  | {
      kind: "bounds";
      bounds: [southWest: LatLngTuple, northEast: LatLngTuple];
      padding: [number, number];
      maxZoom: number;
    };

/** With no marker parks the view asserts no location: a world view. */
const WORLD_VIEW: MapView = { kind: "world", center: [20, 0], zoom: 2 };
const POINT_ZOOM = 14;
/** Padding keeps edge markers off the map border; the cap stops very close parks zooming in extremely. */
const FIT_PADDING: [number, number] = [32, 32];
const FIT_MAX_ZOOM = 15;

/**
 * Chooses the initial map view for the marker parks' coordinates:
 * none → world; one (or all identical) → that point; otherwise their min/max bounds.
 * Descriptors are plain data so this stays free of any Leaflet import.
 */
export function getMapView(points: Coordinates[]): MapView {
  if (points.length === 0) return WORLD_VIEW;

  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);

  // A single point, or points that all coincide, would give a zero-area bounds.
  if (south === north && west === east) {
    return { kind: "point", center: [south, west], zoom: POINT_ZOOM };
  }

  return {
    kind: "bounds",
    bounds: [
      [south, west],
      [north, east],
    ],
    padding: FIT_PADDING,
    maxZoom: FIT_MAX_ZOOM,
  };
}
