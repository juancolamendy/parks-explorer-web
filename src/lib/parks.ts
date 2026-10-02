import type { Coordinates, Park } from "@/lib/types";

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Trimmed text, or null when the value is not a string or is empty/whitespace-only. */
function requiredText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** Optional display text kept verbatim, or null when absent, empty, or whitespace-only. */
function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function toCoordinates(location: unknown): Coordinates | null {
  if (!isRecord(location)) return null;
  const { lat, lng } = location;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function toAmenities(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string => typeof item === "string" && item.trim() !== "",
  );
}

/** Only absolute http(s) URLs survive: relative URLs and other schemes (javascript:, data:, ftp:) are dropped. */
function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function toImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string => typeof item === "string" && isHttpUrl(item),
  );
}

function toNonNegativeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toPark(entry: unknown): Park | null {
  if (!isRecord(entry)) return null;
  const id = requiredText(entry.id);
  const name = requiredText(entry.name);
  if (id === null || name === null) return null;

  const location = isRecord(entry.location) ? entry.location : undefined;
  return {
    id,
    name,
    description: optionalText(entry.description),
    address: optionalText(location?.address),
    coordinates: toCoordinates(entry.location),
    amenities: toAmenities(entry.amenities),
    hours: optionalText(entry.hours),
    images: toImages(entry.images),
    acreage: toNonNegativeNumber(entry.acreage),
    rating: toFiniteNumber(entry.rating),
  };
}

/**
 * Turns untrusted API data into usable parks: drops records without a usable id
 * and name, keeps the first of any repeated id, preserves input order, and never throws.
 */
export function normalizeParks(raw: unknown): Park[] {
  if (!Array.isArray(raw)) return [];
  const seenIds = new Set<string>();
  const parks: Park[] = [];
  for (const entry of raw) {
    const park = toPark(entry);
    if (park === null || seenIds.has(park.id)) continue;
    seenIds.add(park.id);
    parks.push(park);
  }
  return parks;
}

/** The parks that get a map marker: exactly those with valid coordinates. */
export function getMarkerParks(parks: Park[]): Park[] {
  return parks.filter((park) => park.coordinates !== null);
}
