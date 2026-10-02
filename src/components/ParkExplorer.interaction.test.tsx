/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configureAxe } from "vitest-axe";
import sample from "@/data/parks.sample.json";
import ParkExplorer from "@/components/ParkExplorer";
import { fetchParks } from "@/lib/api";
import { makeRawPark } from "@/lib/fixtures/makePark";

// The real hook, context, list, details, and map run; only the network call is mocked.
vi.mock(import("@/lib/api"), () => ({ fetchParks: vi.fn() }));

// `next/dynamic` code-splits and defers the map in the browser; here it returns the real
// ParkMap synchronously so the tests exercise the real map. (ssr:false itself is proved by
// `npm run build` and the manual production check.)
vi.mock("next/dynamic", async () => {
  const { default: ParkMap } = await import("@/components/ParkMap");
  return { default: () => ParkMap };
});

const fetchParksMock = vi.mocked(fetchParks);
const TILE_FAILURE_NOTICE = "Map tiles could not be loaded. The list and details still work.";
// jsdom has no layout, so contrast cannot be computed; it is checked in a real browser (TEST-046).
// Only `axe`/`configureAxe` from vitest-axe are used: its `toHaveNoViolations` matcher types do not
// fit Vitest 5's `Assertion` type, so tests assert on `results.violations` directly (which also
// prints the offending rules and nodes when something fails).
const axe = configureAxe({ rules: { "color-contrast": { enabled: false } } });

let scrollIntoViewMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchParksMock.mockReset();
  fetchParksMock.mockResolvedValue(sample);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  // jsdom has no layout: give Leaflet a fixed map size so it creates tiles and positions markers.
  vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(400);
  vi.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(300);
  // jsdom has no scrollIntoView; define one so scroll calls can be observed.
  scrollIntoViewMock = vi.fn();
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    writable: true,
    value: scrollIntoViewMock,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  Reflect.deleteProperty(navigator, "geolocation");
});

const parksRegion = () => screen.findByRole("region", { name: "Parks" });
const listRegion = () => screen.getByRole("region", { name: "Parks" });
const mapRegion = () => screen.getByRole("region", { name: "Parks map" });
const listButton = (name: string) => within(listRegion()).getByRole("button", { name });
const markerButton = (name: string | RegExp) => within(mapRegion()).getByRole("button", { name });
const markerElements = () => [...mapRegion().querySelectorAll<HTMLElement>(".leaflet-marker-icon")];
const detailsHeading = (name: string) => screen.getByRole("heading", { level: 2, name });

async function renderReady() {
  const utils = render(<ParkExplorer />);
  await parksRegion();
  return utils;
}

describe("[DES-009][AC-005] keyboard selection and focus handoff", () => {
  it("[TEST-036][AC-005][DES-009][TASK-015] leaves focus on the page and does not scroll on load", async () => {
    // Arrange / Act
    await renderReady();

    // Assert
    expect(document.activeElement).toBe(document.body);
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });

  it("[TEST-036][AC-005][DES-009][TASK-015] Tab from outside the list reaches a park; Enter and Space open its details and focus the heading", async () => {
    // Arrange
    const user = userEvent.setup();
    await renderReady();

    // Act: Tab lands on the first park, Enter selects it
    await user.tab();
    const first = document.activeElement as HTMLElement;
    await user.keyboard("{Enter}");

    // Assert
    expect(listRegion()).toContainElement(first);
    expect(first).toHaveAccessibleName("Prospect Park");
    expect(document.activeElement).toBe(detailsHeading("Prospect Park"));

    // Act: from the start of the page again, Tab twice reaches the second park, Space selects it
    (document.activeElement as HTMLElement).blur();
    await user.tab();
    await user.tab();
    const second = document.activeElement as HTMLElement;
    await user.keyboard(" ");

    // Assert
    expect(second).toHaveAccessibleName("Riverside Commons");
    expect(document.activeElement).toBe(detailsHeading("Riverside Commons"));
  });

  it("[TEST-036][AC-005][DES-009][TASK-015] re-activating the already selected park brings focus back to the details heading", async () => {
    // Arrange
    const user = userEvent.setup();
    await renderReady();
    await user.click(listButton("Prospect Park"));
    const heading = detailsHeading("Prospect Park");
    expect(document.activeElement).toBe(heading);
    listButton("Prospect Park").focus();
    expect(document.activeElement).not.toBe(heading);

    // Act
    await user.keyboard("{Enter}");

    // Assert
    expect(document.activeElement).toBe(heading);
  });
});

describe("[DES-013][AC-007] no geolocation", () => {
  function spyOnGeolocation() {
    const read = vi.fn(() => ({
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    }));
    Object.defineProperty(navigator, "geolocation", { configurable: true, get: read });
    return read;
  }

  it("[TEST-037][AC-007][DES-013][TASK-015] never reads navigator.geolocation while loading, listing, selecting, and using the map", async () => {
    // Arrange
    const read = spyOnGeolocation();
    const user = userEvent.setup();

    // Act
    await renderReady();
    await user.click(listButton("Prospect Park"));
    await user.click(markerButton("Riverside Commons"));

    // Assert: parks and details still work, and the API was never touched
    expect(detailsHeading("Riverside Commons")).toBeInTheDocument();
    expect(read).not.toHaveBeenCalled();
  });

  it("[TEST-037][AC-007][DES-013][TASK-015] never reads navigator.geolocation on the failure and Retry path either", async () => {
    // Arrange
    const read = spyOnGeolocation();
    fetchParksMock.mockReset();
    fetchParksMock.mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce(sample);
    const user = userEvent.setup();
    render(<ParkExplorer />);

    // Act
    await user.click(await screen.findByRole("button", { name: "Retry" }));
    await parksRegion();

    // Assert
    expect(read).not.toHaveBeenCalled();
  });
});

describe("[DES-013][AC-008] tile failure", () => {
  it("[TEST-038][AC-008][DES-013][TASK-015] shows one notice and the list and details still work", async () => {
    // Arrange
    const user = userEvent.setup();
    const { container } = await renderReady();
    const tiles = [...container.querySelectorAll<HTMLImageElement>("img.leaflet-tile")];
    expect(tiles.length).toBeGreaterThan(1);

    // Act
    for (const tile of tiles) fireEvent.error(tile);
    await user.click(listButton("Sunset Playground"));

    // Assert
    const notices = screen.getAllByRole("status");
    expect(notices).toHaveLength(1);
    expect(notices[0]).toHaveTextContent(TILE_FAILURE_NOTICE);
    expect(detailsHeading("Sunset Playground")).toBeInTheDocument();
    expect(listButton("Sunset Playground")).toHaveAttribute("aria-current", "true");
    expect(listButton("Prospect Park")).not.toHaveAttribute("aria-current");
  });

  it("[TEST-038][AC-008][DES-013][TASK-015] after tiles fail the markers are still operable", async () => {
    // Arrange
    const user = userEvent.setup();
    const { container } = await renderReady();
    for (const tile of container.querySelectorAll<HTMLImageElement>("img.leaflet-tile")) {
      fireEvent.error(tile);
    }

    // Act
    await user.click(markerButton("Highland Dog Park"));

    // Assert
    expect(detailsHeading("Highland Dog Park")).toBeInTheDocument();
  });
});

describe("[DES-012][AC-012] list, marker, and focus agree", () => {
  const selectedPins = () => mapRegion().querySelectorAll('[data-selected="true"]');

  it("[TEST-039][AC-012][DES-012][TASK-015] activating a marker marks one list item and one marker and focuses the heading", async () => {
    // Arrange
    const user = userEvent.setup();
    await renderReady();

    // Act
    await user.click(markerButton("Prospect Park"));

    // Assert
    const current = within(listRegion())
      .getAllByRole("button")
      .filter((button) => button.hasAttribute("aria-current"));
    expect(current.map((button) => button.textContent)).toEqual(["Prospect Park"]);
    expect(selectedPins()).toHaveLength(1);
    expect(markerButton("Prospect Park (selected)")).toBeInTheDocument();
    expect(document.activeElement).toBe(detailsHeading("Prospect Park"));
  });

  it("[TEST-039][AC-012][DES-012][TASK-015] activating a different park from the list moves all three together", async () => {
    // Arrange
    const user = userEvent.setup();
    await renderReady();
    await user.click(markerButton("Prospect Park"));

    // Act
    await user.click(listButton("Veterans Memorial Field"));

    // Assert
    expect(listButton("Veterans Memorial Field")).toHaveAttribute("aria-current", "true");
    expect(listButton("Prospect Park")).not.toHaveAttribute("aria-current");
    expect(selectedPins()).toHaveLength(1);
    expect(markerButton("Veterans Memorial Field (selected)")).toBeInTheDocument();
    expect(markerButton("Prospect Park")).toBeInTheDocument();
    expect(document.activeElement).toBe(detailsHeading("Veterans Memorial Field"));
  });

  it("[TEST-039][AC-012][DES-012][TASK-015] Enter and Space on a focused marker select its park", async () => {
    // Arrange
    const user = userEvent.setup();
    await renderReady();

    // Act / Assert: Enter
    markerButton("Lakeshore Point").focus();
    await user.keyboard("{Enter}");
    expect(detailsHeading("Lakeshore Point")).toBeInTheDocument();
    expect(document.activeElement).toBe(detailsHeading("Lakeshore Point"));

    // Act / Assert: Space
    markerButton("Hillcrest Skate Park").focus();
    await user.keyboard(" ");
    expect(detailsHeading("Hillcrest Skate Park")).toBeInTheDocument();
    expect(document.activeElement).toBe(detailsHeading("Hillcrest Skate Park"));
  });
});

describe("[DES-005][AC-003] a park without valid coordinates", () => {
  it("[TEST-056][AC-003][DES-005][TASK-015] stays listed and selectable with details, and gets no marker", async () => {
    // Arrange
    fetchParksMock.mockResolvedValue([
      ...sample,
      makeRawPark({ id: "no-location", name: "No Location Park", location: undefined }),
      makeRawPark({ id: "bad-lat", name: "Bad Latitude Park", location: { lat: "x", lng: 1 } }),
    ]);
    const user = userEvent.setup();
    await renderReady();

    // Act
    await user.click(listButton("No Location Park"));

    // Assert
    expect(within(listRegion()).getAllByRole("button")).toHaveLength(14);
    expect(detailsHeading("No Location Park")).toBeInTheDocument();
    await user.click(listButton("Bad Latitude Park"));
    expect(detailsHeading("Bad Latitude Park")).toBeInTheDocument();
    expect(markerElements()).toHaveLength(12);
    expect(within(mapRegion()).queryByRole("button", { name: /No Location Park/ })).toBeNull();
    expect(within(mapRegion()).queryByRole("button", { name: /Bad Latitude Park/ })).toBeNull();
  });
});

describe("[DES-026][AC-015] edge-case data through the whole explorer", () => {
  it.each([
    ["an empty array", []],
    ["only unusable records", [{ id: "", name: "No id" }, null]],
  ])(
    "[TEST-040][AC-015][DES-026][TASK-015] shows a message and no map for %s",
    async (_label, raw) => {
      // Arrange
      fetchParksMock.mockResolvedValue(raw);

      // Act
      render(<ParkExplorer />);
      await screen.findByText("No parks available.");

      // Assert
      expect(screen.queryByRole("region", { name: "Parks map" })).toBeNull();
    },
  );

  it("[TEST-040][AC-015][DES-026][TASK-015] does not mount the map while the parks are loading", () => {
    // Arrange
    fetchParksMock.mockReturnValue(new Promise(() => undefined));

    // Act
    render(<ParkExplorer />);

    // Assert
    expect(screen.getByRole("status")).toHaveTextContent("Loading parks…");
    expect(screen.queryByRole("region", { name: "Parks map" })).toBeNull();
  });

  it("[TEST-040][AC-015][DES-026][TASK-015] does not mount the map after a failure, and mounts it with every marker once Retry succeeds", async () => {
    // Arrange
    fetchParksMock.mockReset();
    fetchParksMock.mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce(sample);
    const user = userEvent.setup();
    render(<ParkExplorer />);
    const retry = await screen.findByRole("button", { name: "Retry" });
    expect(screen.queryByRole("region", { name: "Parks map" })).toBeNull();

    // Act
    await user.click(retry);
    await parksRegion();

    // Assert
    expect(mapRegion()).toBeInTheDocument();
    expect(markerElements()).toHaveLength(12);
  });

  it("[TEST-040][AC-015][DES-026][TASK-015] with no valid coordinates the map still renders, with no markers and no error", async () => {
    // Arrange
    fetchParksMock.mockResolvedValue([
      makeRawPark({ id: "a", name: "Park A", location: undefined }),
      makeRawPark({ id: "b", name: "Park B", location: { lat: 999, lng: 0 } }),
    ]);
    const user = userEvent.setup();

    // Act
    await renderReady();

    // Assert
    expect(mapRegion()).toBeInTheDocument();
    expect(markerElements()).toHaveLength(0);
    await user.click(listButton("Park A"));
    expect(detailsHeading("Park A")).toBeInTheDocument();
  });

  it("[TEST-040][AC-015][DES-026][TASK-015] with exactly one valid coordinate the map shows exactly one marker", async () => {
    // Arrange
    fetchParksMock.mockResolvedValue([
      makeRawPark({ id: "a", name: "Park A", location: undefined }),
      makeRawPark({ id: "only", name: "Only Park" }),
    ]);

    // Act
    await renderReady();

    // Assert
    expect(markerElements()).toHaveLength(1);
    expect(markerButton("Only Park")).toBeInTheDocument();
  });

  it("[TEST-040][AC-015][DES-026][TASK-015] drops records without an id or name and lists the first of a repeated id, with one marker each", async () => {
    // Arrange
    fetchParksMock.mockResolvedValue([
      { id: "", name: "No id" },
      makeRawPark(),
      makeRawPark({ name: "Duplicate Of Prospect" }),
      makeRawPark({}, "riverside-commons"),
      makeRawPark({ id: "blank-name", name: "  " }),
    ]);

    // Act
    await renderReady();

    // Assert
    const names = within(listRegion()).getAllByRole("button").map((button) => button.textContent);
    expect(names).toEqual(["Prospect Park", "Riverside Commons"]);
    expect(markerElements()).toHaveLength(2);
  });
});

describe("[DES-020][AC-013] structural accessibility", () => {
  it("[TEST-041][AC-013][DES-020][TASK-015] has no axe violations (contrast aside) before anything is selected", async () => {
    // Arrange / Act
    const { container } = await renderReady();
    const results = await axe(container);

    // Assert
    expect(results.violations).toEqual([]);
  });

  it("[TEST-041][AC-013][DES-020][TASK-015] has no axe violations (contrast aside) with a park selected", async () => {
    // Arrange
    const user = userEvent.setup();
    const { container } = await renderReady();
    await user.click(listButton("Prospect Park"));

    // Act
    const results = await axe(container);

    // Assert
    expect(results.violations).toEqual([]);
  });

  it("[TEST-041][AC-013][DES-020][TASK-015] gives every button an accessible name", async () => {
    // Arrange / Act
    await renderReady();

    // Assert
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(24);
    for (const button of buttons) expect(button).toHaveAccessibleName();
  });
});
