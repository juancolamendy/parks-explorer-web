import { describe, expect, it } from "vitest";
import sample from "@/data/parks.sample.json";
import { getMapView } from "@/lib/mapView";
import { getMarkerParks, normalizeParks } from "@/lib/parks";
import type { Coordinates } from "@/lib/types";

const sampleCoordinates = (): Coordinates[] =>
  getMarkerParks(normalizeParks(sample)).flatMap((park) =>
    park.coordinates ? [park.coordinates] : [],
  );

describe("[DES-026][AC-015] zero, one, and identical points", () => {
  it("[TEST-011][AC-015][DES-026][TASK-005] shows a world view with no marker location asserted when there are no points", () => {
    // Arrange / Act
    const view = getMapView([]);

    // Assert
    expect(view).toEqual({ kind: "world", center: [20, 0], zoom: 2 });
  });

  it("[TEST-011][AC-015][DES-026][TASK-005] centres on a single point at zoom 14, never a zero-area bounds", () => {
    // Arrange
    const points: Coordinates[] = [{ lat: 40.6602, lng: -73.969 }];

    // Act
    const view = getMapView(points);

    // Assert
    expect(view).toEqual({ kind: "point", center: [40.6602, -73.969], zoom: 14 });
  });

  it("[TEST-011][AC-015][DES-026][TASK-005] treats several identical points as a single point", () => {
    // Arrange
    const points: Coordinates[] = [
      { lat: 10, lng: 20 },
      { lat: 10, lng: 20 },
      { lat: 10, lng: 20 },
    ];

    // Act
    const view = getMapView(points);

    // Assert
    expect(view).toEqual({ kind: "point", center: [10, 20], zoom: 14 });
  });

  it("[TEST-011][AC-015][DES-026][TASK-005] uses bounds as soon as two points differ, even only in longitude", () => {
    // Arrange
    const points: Coordinates[] = [
      { lat: 10, lng: 20 },
      { lat: 10, lng: 20.001 },
    ];

    // Act
    const view = getMapView(points);

    // Assert
    expect(view.kind).toBe("bounds");
  });
});

describe("[DES-026][AC-002] bounds for several points", () => {
  it("[TEST-012][AC-002][DES-026][TASK-005] returns the min/max bounds of the 12 sample parks with padding and a max zoom of 15", () => {
    // Arrange
    const points = sampleCoordinates();

    // Act
    const view = getMapView(points);

    // Assert
    expect(points).toHaveLength(12);
    expect(view).toEqual({
      kind: "bounds",
      bounds: [
        [40.5795, -74.0899],
        [40.8501, -73.7949],
      ],
      padding: [32, 32],
      maxZoom: 15,
    });
  });

  it("[TEST-012][AC-002][DES-026][TASK-005] contains every input point inside the bounds", () => {
    // Arrange
    const points = sampleCoordinates();

    // Act
    const view = getMapView(points);

    // Assert
    if (view.kind !== "bounds") throw new Error("expected a bounds view");
    const [[south, west], [north, east]] = view.bounds;
    for (const { lat, lng } of points) {
      expect(lat).toBeGreaterThanOrEqual(south);
      expect(lat).toBeLessThanOrEqual(north);
      expect(lng).toBeGreaterThanOrEqual(west);
      expect(lng).toBeLessThanOrEqual(east);
    }
  });

  it("[TEST-012][AC-002][DES-026][TASK-005] gives the same bounds regardless of input order", () => {
    // Arrange
    const points = sampleCoordinates();

    // Act
    const forward = getMapView(points);
    const reversed = getMapView([...points].reverse());

    // Assert
    expect(reversed).toEqual(forward);
  });

  it("[TEST-012][AC-002][DES-026][TASK-005] handles points across hemispheres and very close points", () => {
    // Arrange
    const spread: Coordinates[] = [
      { lat: -33.8688, lng: 151.2093 },
      { lat: 40.7128, lng: -74.006 },
    ];
    const close: Coordinates[] = [
      { lat: 40.7, lng: -74 },
      { lat: 40.70001, lng: -74.00001 },
    ];

    // Act
    const spreadView = getMapView(spread);
    const closeView = getMapView(close);

    // Assert
    expect(spreadView).toMatchObject({
      kind: "bounds",
      bounds: [
        [-33.8688, -74.006],
        [40.7128, 151.2093],
      ],
    });
    expect(closeView).toMatchObject({ kind: "bounds", maxZoom: 15 });
  });
});
