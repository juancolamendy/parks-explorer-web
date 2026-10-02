/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sample from "@/data/parks.sample.json";
import ParkMap from "@/components/ParkMap";
import { makeRawPark } from "@/lib/fixtures/makePark";
import { normalizeParks } from "@/lib/parks";

const VIEW_WIDTH = 400;
const VIEW_HEIGHT = 300;
const TILE_FAILURE_NOTICE = "Map tiles could not be loaded. The list and details still work.";

const sampleParks = normalizeParks(sample);
const parksWithNoCoordinates = normalizeParks([
  ...sample,
  makeRawPark({ id: "no-coords", name: "No Coords Park", location: undefined }),
]);

beforeEach(() => {
  // jsdom has no layout: give Leaflet a fixed map size so it creates tiles and positions markers.
  vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(VIEW_WIDTH);
  vi.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(VIEW_HEIGHT);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderMap(
  options: { parks?: typeof sampleParks; selectedParkId?: string | null } = {},
) {
  const onSelect = vi.fn();
  const utils = render(
    <ParkMap
      parks={options.parks ?? sampleParks}
      selectedParkId={options.selectedParkId ?? null}
      onSelect={onSelect}
    />,
  );
  return { onSelect, ...utils };
}

const markersIn = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>(".leaflet-marker-icon")];

const tilesIn = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLImageElement>("img.leaflet-tile")];

const tileZooms = (container: HTMLElement) => [
  ...new Set(
    tilesIn(container).map((tile) =>
      Number(/\/(\d+)\/\d+\/\d+\.png/.exec(tile.getAttribute("src") ?? "")?.[1]),
    ),
  ),
];

describe("[DES-005][AC-002] one marker per valid-coordinate park", () => {
  it("[TEST-013][AC-002][DES-005][TASK-006] renders a marker for each of the 12 sample parks", () => {
    // Arrange / Act
    const { container } = renderMap();

    // Assert
    expect(markersIn(container)).toHaveLength(12);
  });

  it("[TEST-013][AC-002][DES-005][TASK-006] renders no marker for a park without valid coordinates", () => {
    // Arrange / Act
    const { container } = renderMap({ parks: parksWithNoCoordinates });

    // Assert
    expect(parksWithNoCoordinates).toHaveLength(13);
    expect(markersIn(container)).toHaveLength(12);
    expect(screen.queryByRole("button", { name: "No Coords Park" })).toBeNull();
  });

  it("[TEST-013][AC-002][DES-026][TASK-006] puts every marker inside the initial view at a sensible zoom", () => {
    // Arrange / Act
    const { container } = renderMap();

    // Assert
    for (const marker of markersIn(container)) {
      const left = parseFloat(marker.style.left);
      const top = parseFloat(marker.style.top);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(left).toBeLessThanOrEqual(VIEW_WIDTH);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top).toBeLessThanOrEqual(VIEW_HEIGHT);
    }
    const [zoom] = tileZooms(container);
    expect(tileZooms(container)).toHaveLength(1);
    expect(zoom).toBeGreaterThanOrEqual(8);
    expect(zoom).toBeLessThanOrEqual(15);
  });

  it("[TEST-013][AC-015][DES-026][TASK-006] shows a world view and no markers when no park has coordinates", () => {
    // Arrange
    const noLocations = normalizeParks([
      makeRawPark({ location: undefined }),
      makeRawPark({ location: null }, "riverside-commons"),
    ]);

    // Act
    const { container } = renderMap({ parks: noLocations });

    // Assert
    expect(markersIn(container)).toHaveLength(0);
    expect(tileZooms(container)).toEqual([2]);
  });

  it("[TEST-013][AC-015][DES-026][TASK-006] centres on a single marker at zoom 14", () => {
    // Arrange
    const single = normalizeParks([makeRawPark()]);

    // Act
    const { container } = renderMap({ parks: single });

    // Assert
    expect(markersIn(container)).toHaveLength(1);
    expect(tileZooms(container)).toEqual([14]);
  });

  it("[TEST-013][AC-002][DES-005][TASK-006] renders each marker once under React StrictMode", () => {
    // Arrange / Act
    const { container } = render(
      <ParkMap parks={sampleParks} selectedParkId={null} onSelect={vi.fn()} />,
      { reactStrictMode: true },
    );

    // Assert
    expect(markersIn(container)).toHaveLength(12);
    expect(container.querySelectorAll(".leaflet-container")).toHaveLength(1);
  });

  it("[TEST-013][DES-005][TASK-006] shows OpenStreetMap attribution and an explicit Tailwind height", () => {
    // Arrange / Act
    const { container } = renderMap();

    // Assert
    expect(container.querySelector(".leaflet-control-attribution")).toHaveTextContent(
      "OpenStreetMap",
    );
    const region = screen.getByRole("region", { name: "Parks map" });
    const sized = region.querySelector<HTMLElement>("div");
    expect(sized?.className).toContain("h-72");
    expect(sized?.className).toContain("lg:h-96");
  });
});

describe("[DES-005][AC-002] selecting a marker", () => {
  it("[TEST-014][AC-002][DES-005][TASK-006] selects the clicked park only", async () => {
    // Arrange
    const { onSelect } = renderMap();
    const user = userEvent.setup();

    // Act
    await user.click(screen.getByRole("button", { name: "Riverside Commons" }));

    // Assert
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("riverside-commons");
  });

  it("[TEST-014][AC-002][DES-005][TASK-006] selects the focused park with Enter", async () => {
    // Arrange
    const { onSelect } = renderMap();
    const user = userEvent.setup();
    const marker = screen.getByRole("button", { name: "Prospect Park" });
    marker.focus();

    // Act
    await user.keyboard("{Enter}");

    // Assert
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("prospect-park");
  });

  it("[TEST-014][AC-002][DES-005][TASK-006] selects the focused park with Space", async () => {
    // Arrange
    const { onSelect } = renderMap();
    const user = userEvent.setup();
    const marker = screen.getByRole("button", { name: "Lakeshore Point" });
    marker.focus();

    // Act
    await user.keyboard(" ");

    // Assert
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("lakeshore-point");
  });

  it("[TEST-014][AC-002][DES-005][TASK-006] prevents the page from scrolling on Space and Enter", () => {
    // Arrange
    renderMap();
    const marker = screen.getByRole("button", { name: "Prospect Park" });

    // Act
    const spaceAllowed = fireEvent.keyDown(marker, { key: " " });
    const enterAllowed = fireEvent.keyDown(marker, { key: "Enter" });

    // Assert
    expect(spaceAllowed).toBe(false);
    expect(enterAllowed).toBe(false);
  });

  it("[TEST-014][AC-002][DES-005][TASK-006] ignores other keys on a marker", async () => {
    // Arrange
    const { onSelect } = renderMap();
    const user = userEvent.setup();
    screen.getByRole("button", { name: "Prospect Park" }).focus();

    // Act
    await user.keyboard("a");
    await user.keyboard("{Escape}");

    // Assert
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("[DES-028][AC-008] tile failure", () => {
  it("[TEST-015][AC-008][DES-028][TASK-006] shows one status notice however many tiles fail and keeps markers working", async () => {
    // Arrange
    const { container, onSelect } = renderMap();
    const user = userEvent.setup();
    expect(screen.queryByRole("status")).toBeNull();
    const tiles = tilesIn(container);
    expect(tiles.length).toBeGreaterThan(1);

    // Act
    for (const tile of tiles) fireEvent.error(tile);

    // Assert
    const notices = screen.getAllByRole("status");
    expect(notices).toHaveLength(1);
    expect(notices[0]).toHaveTextContent(TILE_FAILURE_NOTICE);
    expect(markersIn(container)).toHaveLength(12);
    await user.click(screen.getByRole("button", { name: "Prospect Park" }));
    expect(onSelect).toHaveBeenCalledWith("prospect-park");
  });
});

describe("[DES-025] marker accessible names and selected cue", () => {
  it("[TEST-016][DES-025][TASK-006] gives each marker a unique title and hidden park-name text", () => {
    // Arrange / Act
    const { container } = renderMap();

    // Assert
    const markers = markersIn(container);
    const titles = markers.map((marker) => marker.getAttribute("title"));
    expect(new Set(titles).size).toBe(12);
    expect(titles.sort()).toEqual(sampleParks.map((park) => park.name).sort());
    for (const marker of markers) {
      expect(marker.querySelector(".sr-only")).toHaveTextContent(
        marker.getAttribute("title") ?? "never",
      );
      expect(marker).toHaveAttribute("tabindex", "0");
      expect(marker).toHaveAttribute("role", "button");
    }
  });

  it("[TEST-016][DES-025][TASK-006] marks only the selected park with data-selected, a larger size, and a ring", () => {
    // Arrange / Act
    const { container } = renderMap({ selectedParkId: "riverside-commons" });

    // Assert
    const selectedPins = container.querySelectorAll<HTMLElement>('[data-selected="true"]');
    const unselectedPins = container.querySelectorAll<HTMLElement>('[data-selected="false"]');
    expect(selectedPins).toHaveLength(1);
    expect(unselectedPins).toHaveLength(11);
    expect(selectedPins[0].className).toContain("ring-4");
    expect(selectedPins[0].className).toContain("h-8");
    for (const pin of unselectedPins) {
      expect(pin.className).not.toContain("ring-4");
      expect(pin.className).toContain("h-6");
    }
    expect(
      screen.getByRole("button", { name: "Riverside Commons (selected)" }),
    ).toBeInTheDocument();
  });

  it("[TEST-016][DES-025][TASK-006] moves the selected cue when the selection changes", () => {
    // Arrange
    const onSelect = vi.fn();
    const { container, rerender } = render(
      <ParkMap parks={sampleParks} selectedParkId="riverside-commons" onSelect={onSelect} />,
    );

    // Act
    rerender(<ParkMap parks={sampleParks} selectedParkId="prospect-park" onSelect={onSelect} />);

    // Assert
    expect(container.querySelectorAll('[data-selected="true"]')).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Prospect Park (selected)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Riverside Commons" })).toBeInTheDocument();
  });

  it("[TEST-016][DES-019][TASK-006] renders a park name containing HTML as text, never as markup", () => {
    // Arrange
    const hostile = normalizeParks([
      makeRawPark({ id: "evil", name: '<img src=x onerror="alert(1)"> Evil Park' }),
    ]);

    // Act
    const { container } = renderMap({ parks: hostile });

    // Assert
    const [marker] = markersIn(container);
    expect(marker.querySelector("img")).toBeNull();
    expect(marker).toHaveTextContent('<img src=x onerror="alert(1)"> Evil Park');
  });
});
