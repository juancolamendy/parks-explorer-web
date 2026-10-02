import sample from "@/data/parks.sample.json";

/**
 * Test fixture: a deep copy of one sample record with top-level overrides.
 * The sample file itself is never modified; override a key with `undefined` to
 * simulate an absent field.
 */
export function makeRawPark(
  overrides: Record<string, unknown> = {},
  sourceId = "prospect-park",
): Record<string, unknown> {
  const source = sample.find((record) => record.id === sourceId);
  if (!source) {
    throw new Error(`makeRawPark: no sample record with id "${sourceId}"`);
  }
  return { ...structuredClone(source), ...overrides };
}
