import { describe, expect, it } from "vitest";
import sample from "@/data/parks.sample.json";
import { makeRawPark } from "@/lib/fixtures/makePark";
import { getMarkerParks, normalizeParks } from "@/lib/parks";

const INVALID_LOCATIONS: Array<[string, unknown]> = [
  ["lat is a string", { lat: "40.7", lng: -73.9 }],
  ["lng is a string", { lat: 40.7, lng: "-73.9" }],
  ["lat is null", { lat: null, lng: -73.9 }],
  ["lng is null", { lat: 40.7, lng: null }],
  ["lat is missing", { lng: -73.9 }],
  ["lng is missing", { lat: 40.7 }],
  ["lat is NaN", { lat: Number.NaN, lng: -73.9 }],
  ["lng is Infinity", { lat: 40.7, lng: Number.POSITIVE_INFINITY }],
  ["lat is -Infinity", { lat: Number.NEGATIVE_INFINITY, lng: -73.9 }],
  ["lat is above 90", { lat: 90.0001, lng: -73.9 }],
  ["lat is below -90", { lat: -90.0001, lng: -73.9 }],
  ["lng is above 180", { lat: 40.7, lng: 180.0001 }],
  ["lng is below -180", { lat: 40.7, lng: -180.0001 }],
  ["location is null", null],
  ["location is a string", "Brooklyn"],
  ["location is an array", [40.7, -73.9]],
  ["location is absent", undefined],
];

describe("[DES-014][AC-003] coordinates", () => {
  it.each(INVALID_LOCATIONS)(
    "[TEST-002][AC-003][DES-014][TASK-002] keeps the park listed with no coordinates when %s",
    (_label, location) => {
      // Arrange
      const raw = [makeRawPark({ location })];

      // Act
      const parks = normalizeParks(raw);

      // Assert
      expect(parks).toHaveLength(1);
      expect(parks[0].coordinates).toBeNull();
      expect(getMarkerParks(parks)).toEqual([]);
    },
  );

  it.each([
    [90, 180],
    [-90, -180],
    [0, 0],
    [40.6602, -73.969],
  ])(
    "[TEST-002][AC-003][DES-014][TASK-002] accepts the valid coordinates %s, %s (boundaries and zero included)",
    (lat, lng) => {
      // Arrange
      const raw = [makeRawPark({ location: { lat, lng } })];

      // Act
      const parks = normalizeParks(raw);

      // Assert
      expect(parks[0].coordinates).toEqual({ lat, lng });
      expect(getMarkerParks(parks)).toHaveLength(1);
    },
  );
});

describe("[DES-014][AC-015] usable records", () => {
  it.each([undefined, null, {}, "parks", 42])(
    "[TEST-003][AC-015][DES-014][TASK-002] returns an empty list for non-array input %#",
    (raw) => {
      // Arrange / Act
      const parks = normalizeParks(raw);

      // Assert
      expect(parks).toEqual([]);
    },
  );

  it("[TEST-003][AC-015][DES-014][TASK-002] skips entries that are not objects", () => {
    // Arrange
    const raw = [null, 1, "x", [], undefined, makeRawPark()];

    // Act
    const parks = normalizeParks(raw);

    // Assert
    expect(parks.map((park) => park.id)).toEqual(["prospect-park"]);
  });

  it.each([
    ["id is missing", { id: undefined }],
    ["id is empty", { id: "" }],
    ["id is whitespace only", { id: "   " }],
    ["id is not a string", { id: 5 }],
    ["name is missing", { name: undefined }],
    ["name is empty", { name: "" }],
    ["name is whitespace only", { name: "  \t " }],
    ["name is not a string", { name: 5 }],
  ])(
    "[TEST-003][AC-015][DES-014][TASK-002] excludes a record whose %s",
    (_label, overrides) => {
      // Arrange
      const raw = [makeRawPark(overrides), makeRawPark({}, "riverside-commons")];

      // Act
      const parks = normalizeParks(raw);

      // Assert
      expect(parks.map((park) => park.id)).toEqual(["riverside-commons"]);
    },
  );

  it("[TEST-003][AC-015][DES-014][TASK-002] trims id and name", () => {
    // Arrange
    const raw = [makeRawPark({ id: "  prospect-park  ", name: "  Prospect Park " })];

    // Act
    const [park] = normalizeParks(raw);

    // Assert
    expect(park.id).toBe("prospect-park");
    expect(park.name).toBe("Prospect Park");
  });

  it("[TEST-003][AC-015][DES-014][TASK-002] keeps the first record when an id repeats, in input order", () => {
    // Arrange
    const raw = [
      makeRawPark({ id: "dup", name: "First" }),
      makeRawPark({}, "riverside-commons"),
      makeRawPark({ id: "dup", name: "Second" }),
    ];

    // Act
    const parks = normalizeParks(raw);

    // Assert
    expect(parks.map((park) => [park.id, park.name])).toEqual([
      ["dup", "First"],
      ["riverside-commons", "Riverside Commons"],
    ]);
  });

  it("[TEST-003][AC-015][DES-014][TASK-002] lists a later record when the earlier one with the same id was unusable", () => {
    // Arrange
    const raw = [
      makeRawPark({ id: "dup", name: "" }),
      makeRawPark({ id: "dup", name: "Valid" }),
    ];

    // Act
    const parks = normalizeParks(raw);

    // Assert
    expect(parks.map((park) => park.name)).toEqual(["Valid"]);
  });

  it("[TEST-003][AC-015][DES-014][TASK-002] normalizes the whole sample to 12 parks, all with markers, in order", () => {
    // Arrange
    const sampleIds = sample.map((record) => record.id);

    // Act
    const parks = normalizeParks(sample);

    // Assert
    expect(parks.map((park) => park.id)).toEqual(sampleIds);
    expect(getMarkerParks(parks)).toHaveLength(12);
  });
});

describe("[DES-014][AC-004] sparse and malformed fields", () => {
  it("[TEST-004][AC-004][DES-014][TASK-002] turns null, absent, and empty sample fields into null or empty lists", () => {
    // Arrange
    const raw = [
      makeRawPark({}, "old-mill-botanical-garden"),
      makeRawPark({}, "highland-dog-park"),
      makeRawPark({}, "cedar-hill-nature-preserve"),
    ];

    // Act
    const [oldMill, highland, cedar] = normalizeParks(raw);

    // Assert
    expect(oldMill.description).toBeNull();
    expect(highland.address).toBeNull();
    expect(cedar.images).toEqual([]);
    expect(cedar.rating).toBeNull();
  });

  it("[TEST-004][AC-004][DES-014][TASK-002] treats empty and whitespace-only text as absent and keeps real text verbatim", () => {
    // Arrange
    const raw = [
      makeRawPark({
        description: "   ",
        hours: "",
        location: { lat: 1, lng: 2, address: " 12 Old Mill Ln " },
      }),
    ];

    // Act
    const [park] = normalizeParks(raw);

    // Assert
    expect(park.description).toBeNull();
    expect(park.hours).toBeNull();
    expect(park.address).toBe(" 12 Old Mill Ln ");
  });

  it("[TEST-004][AC-004][DES-014][TASK-002] drops non-string and empty amenities and treats a non-array as empty", () => {
    // Arrange
    const raw = [
      makeRawPark({ amenities: ["trails", 5, "", "  ", null, "parking"] }),
      makeRawPark({ amenities: "trails" }, "riverside-commons"),
    ];

    // Act
    const [mixed, notArray] = normalizeParks(raw);

    // Assert
    expect(mixed.amenities).toEqual(["trails", "parking"]);
    expect(notArray.amenities).toEqual([]);
  });

  it.each([
    ["negative", -1],
    ["a string", "5"],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
  ])(
    "[TEST-004][AC-004][DES-014][TASK-002] turns an acreage that is %s into null",
    (_label, acreage) => {
      // Arrange
      const raw = [makeRawPark({ acreage })];

      // Act
      const [park] = normalizeParks(raw);

      // Assert
      expect(park.acreage).toBeNull();
    },
  );

  it("[TEST-004][AC-004][DES-014][TASK-002] keeps a finite rating of 0 and turns a non-numeric rating into null", () => {
    // Arrange
    const raw = [
      makeRawPark({ rating: 0 }),
      makeRawPark({ rating: "4.5" }, "riverside-commons"),
    ];

    // Act
    const [zero, text] = normalizeParks(raw);

    // Assert
    expect(zero.rating).toBe(0);
    expect(text.rating).toBeNull();
  });

  it("[TEST-004][AC-004][DES-014][TASK-002] drops unknown fields and exposes exactly the Park fields", () => {
    // Arrange
    const raw = [makeRawPark({ surprise: "<script>x</script>", extra: { a: 1 } })];

    // Act
    const [park] = normalizeParks(raw);

    // Assert
    expect(Object.keys(park).sort()).toEqual([
      "acreage",
      "address",
      "amenities",
      "coordinates",
      "description",
      "hours",
      "id",
      "images",
      "name",
      "rating",
    ]);
  });
});

describe("[DES-019] image URLs from untrusted data", () => {
  it("[TEST-005][DES-019][TASK-002] keeps only absolute http and https image URLs", () => {
    // Arrange
    const raw = [
      makeRawPark({
        images: [
          "javascript:alert(1)",
          "data:text/html,x",
          "/relative.jpg",
          "relative.jpg",
          "ftp://example.com/a.jpg",
          "https://images.example.com/ok-1.jpg",
          "http://images.example.com/ok-2.jpg",
          "HTTPS://images.example.com/ok-3.jpg",
          "",
          42,
          null,
        ],
      }),
    ];

    // Act
    const [park] = normalizeParks(raw);

    // Assert
    expect(park.images).toEqual([
      "https://images.example.com/ok-1.jpg",
      "http://images.example.com/ok-2.jpg",
      "HTTPS://images.example.com/ok-3.jpg",
    ]);
  });
});
