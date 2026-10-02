import { describe, expect, it } from "vitest";
import sample from "@/data/parks.sample.json";
import {
  formatAcreage,
  formatAmenity,
  formatRating,
  imageAlt,
} from "@/lib/format";

describe("[DES-004][AC-011] formatted display strings", () => {
  it.each([
    ["dog-run", "Dog run"],
    ["wifi", "Wifi"],
    ["kayak-launch", "Kayak launch"],
    ["accessible-paths", "Accessible paths"],
    ["a--b", "A b"],
    ["-trails-", "Trails"],
    ["BBQ-pit", "BBQ pit"],
  ])(
    "[TEST-021][AC-011][DES-004][TASK-009] formats the amenity slug %s as %s",
    (slug, label) => {
      // Arrange / Act
      const result = formatAmenity(slug);

      // Assert
      expect(result).toBe(label);
    },
  );

  it.each(["-", "--", "", "   ", " - "])(
    "[TEST-021][AC-011][DES-004][TASK-009] drops the amenity slug %j because its label would be empty",
    (slug) => {
      // Arrange / Act
      const result = formatAmenity(slug);

      // Assert
      expect(result).toBeNull();
    },
  );

  it("[TEST-021][AC-011][DES-004][TASK-009] gives every amenity slug in the sample a hyphen-free label starting with a capital", () => {
    // Arrange
    const slugs = [...new Set(sample.flatMap((park) => park.amenities))];

    // Act
    const labels = slugs.map((slug) => formatAmenity(slug));

    // Assert
    expect(slugs).toHaveLength(26);
    for (const label of labels) {
      expect(label).not.toBeNull();
      expect(label).not.toContain("-");
      expect(label?.[0]).toBe(label?.[0].toUpperCase());
    }
  });

  it.each([
    [526, "526 acres"],
    [2, "2 acres"],
    [0, "0 acres"],
    [12.5, "12.5 acres"],
  ])(
    "[TEST-021][AC-011][DES-004][TASK-009] formats the acreage %s as %s with no other unit",
    (acreage, text) => {
      // Arrange / Act
      const result = formatAcreage(acreage);

      // Assert
      expect(result).toBe(text);
    },
  );

  it.each([
    [4.7, "Rating: 4.7"],
    [0, "Rating: 0"],
    [4, "Rating: 4"],
  ])(
    "[TEST-021][AC-011][DES-004][TASK-009] formats the rating %s as %s without a scale or review count",
    (rating, text) => {
      // Arrange / Act
      const result = formatRating(rating);

      // Assert
      expect(result).toBe(text);
      expect(result).not.toContain("/");
      expect(result.toLowerCase()).not.toContain("review");
    },
  );
});

describe("[DES-004][AC-004] missing values", () => {
  it.each([null, undefined, Number.NaN, Number.POSITIVE_INFINITY])(
    "[TEST-022][AC-004][DES-004][TASK-009] says the rating is not provided for %s instead of inventing one",
    (rating) => {
      // Arrange / Act
      const result = formatRating(rating);

      // Assert
      expect(result).toBe("Rating not provided");
    },
  );

  it("[TEST-022][AC-004][DES-004][TASK-009] builds image alt text from the position and the supplied name only", () => {
    // Arrange / Act
    const second = imageAlt("Prospect Park", 2);
    const trimmed = imageAlt("  Prospect Park ", 1);

    // Assert
    expect(second).toBe("Photo 2 of Prospect Park");
    expect(trimmed).toBe("Photo 1 of Prospect Park");
  });

  it("[TEST-022][AC-004][DES-004][TASK-009] falls back to the position alone when the name is empty", () => {
    // Arrange / Act
    const empty = imageAlt("", 2);
    const blank = imageAlt("   ", 1);

    // Assert
    expect(empty).toBe("Photo 2");
    expect(blank).toBe("Photo 1");
  });
});
