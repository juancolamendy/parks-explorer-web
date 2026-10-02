/**
 * Display strings built only by formatting supplied values: no synonyms, no
 * translations, no scale or unit the dataset does not state.
 */

/**
 * Readable label for an amenity slug: split on "-", join with spaces, uppercase the
 * first character (`dog-run` → "Dog run"). Returns null when the label would be empty
 * so callers can drop it; unknown slugs still get a label.
 */
export function formatAmenity(slug: string): string | null {
  const words = slug
    .split("-")
    .map((word) => word.trim())
    .filter((word) => word !== "");
  if (words.length === 0) return null;
  const label = words.join(" ");
  return label[0].toUpperCase() + label.slice(1);
}

/** Acreage is always shown as "{n} acres" (REQ-F-012, Q-004). */
export function formatAcreage(acreage: number): string {
  return `${acreage} acres`;
}

/**
 * "Rating: {n}" with no scale or review count, or "Rating not provided" when the
 * value is missing or not a finite number. 0 is a valid rating.
 */
export function formatRating(rating: number | null | undefined): string {
  return typeof rating === "number" && Number.isFinite(rating)
    ? `Rating: ${rating}`
    : "Rating not provided";
}

/** Alt text from the 1-based position and the supplied park name only; never describes image content. */
export function imageAlt(name: string, position: number): string {
  const trimmed = name.trim();
  return trimmed === "" ? `Photo ${position}` : `Photo ${position} of ${trimmed}`;
}
