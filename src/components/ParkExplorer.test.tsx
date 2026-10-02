/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sample from "@/data/parks.sample.json";
import ParkExplorer from "@/components/ParkExplorer";
import { FETCH_ERROR_MESSAGE } from "@/hooks/useParksFetch";
import { fetchParks } from "@/lib/api";
import { makeRawPark } from "@/lib/fixtures/makePark";

// The real hook, context, and components run; only the network call is mocked.
vi.mock(import("@/lib/api"), () => ({ fetchParks: vi.fn() }));

// These tests are about the data states (list, details, loading, failure, empty) only. The
// client-only map has its own tests (ParkMap.test.tsx and ParkExplorer.interaction.test.tsx), and
// its markers are buttons named after each park, which would make the list queries below
// ambiguous, so the map is stubbed out here.
vi.mock("next/dynamic", () => ({ default: () => () => null }));

const fetchParksMock = vi.mocked(fetchParks);
const PROMPT = "Select a park from the list or map to see its details";

beforeEach(() => {
  fetchParksMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const parksRegion = () => screen.findByRole("region", { name: "Parks" });
const listButtons = () =>
  within(screen.getByRole("region", { name: "Parks" })).getAllByRole("button");

describe("[DES-001][AC-001] list, nothing selected, and details", () => {
  it("[TEST-032][AC-001][DES-001][TASK-014] lists every usable park in order with nothing selected and the prompt showing", async () => {
    // Arrange
    fetchParksMock.mockResolvedValue(sample);

    // Act
    render(<ParkExplorer />);
    await parksRegion();

    // Assert
    const buttons = listButtons();
    expect(buttons.map((button) => button.textContent)).toEqual(sample.map((park) => park.name));
    for (const button of buttons) expect(button).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("region", { name: "Park details" })).toHaveTextContent(PROMPT);
    expect(screen.getByRole("heading", { level: 1, name: "Parks Explorer" })).toBeInTheDocument();
  });

  it("[TEST-032][AC-001][DES-001][TASK-014] causes no focus change on load", async () => {
    // Arrange
    fetchParksMock.mockResolvedValue(sample);

    // Act
    render(<ParkExplorer />);
    await parksRegion();

    // Assert
    expect(document.activeElement).toBe(document.body);
  });

  it.each(sample.map((park) => [park.name]))(
    "[TEST-032][AC-001][DES-001][TASK-014] activating %s shows that park's details and marks only it as current",
    async (name) => {
      // Arrange
      fetchParksMock.mockResolvedValue(sample);
      const user = userEvent.setup();
      render(<ParkExplorer />);
      await parksRegion();

      // Act
      await user.click(screen.getByRole("button", { name }));

      // Assert
      expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
      const current = listButtons().filter((button) => button.hasAttribute("aria-current"));
      expect(current.map((button) => button.textContent)).toEqual([name]);
      expect(screen.queryByText(PROMPT)).not.toBeInTheDocument();
    },
  );

  it("[TEST-032][AC-001][DES-001][TASK-014] moves the details and the current mark when a different park is activated", async () => {
    // Arrange
    fetchParksMock.mockResolvedValue(sample);
    const user = userEvent.setup();
    render(<ParkExplorer />);
    await parksRegion();
    await user.click(screen.getByRole("button", { name: "Prospect Park" }));

    // Act
    await user.click(screen.getByRole("button", { name: "Sunset Playground" }));

    // Assert
    expect(screen.getByRole("heading", { level: 2, name: "Sunset Playground" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Prospect Park" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Prospect Park" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: "Sunset Playground" })).toHaveAttribute("aria-current", "true");
  });
});

describe("[DES-001][AC-003] a park without coordinates", () => {
  it("[TEST-033][AC-003][DES-001][TASK-014] stays listed and selectable and its details render", async () => {
    // Arrange
    const noLocation = makeRawPark({ id: "no-location", name: "No Location Park", location: undefined });
    fetchParksMock.mockResolvedValue([...sample, noLocation]);
    const user = userEvent.setup();
    render(<ParkExplorer />);
    await parksRegion();

    // Act
    await user.click(screen.getByRole("button", { name: "No Location Park" }));

    // Assert
    expect(listButtons()).toHaveLength(13);
    expect(screen.getByRole("heading", { level: 2, name: "No Location Park" })).toBeInTheDocument();
    expect(screen.getByText("Address not provided")).toBeInTheDocument();
  });
});

describe("[DES-013][AC-009] loading, failure, and Retry", () => {
  it("[TEST-034][AC-009][DES-013][TASK-014] shows a loading status and no list or details while loading", () => {
    // Arrange
    fetchParksMock.mockReturnValue(new Promise(() => undefined));

    // Act
    render(<ParkExplorer />);

    // Assert
    expect(screen.getByRole("status")).toHaveTextContent("Loading parks…");
    expect(screen.queryByRole("region", { name: "Parks" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Park details" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Parks Explorer" })).toBeInTheDocument();
  });

  it("[TEST-034][AC-009][DES-013][TASK-014] shows a user-safe alert with a Retry button when loading fails", async () => {
    // Arrange
    fetchParksMock.mockRejectedValue(new Error("secret-internal-detail"));

    // Act
    render(<ParkExplorer />);
    const alert = await screen.findByRole("alert");

    // Assert
    expect(alert).toHaveTextContent(FETCH_ERROR_MESSAGE);
    expect(alert).not.toHaveTextContent("secret-internal-detail");
    expect(within(alert).getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Parks" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Park details" })).not.toBeInTheDocument();
  });

  it("[TEST-034][AC-009][DES-013][TASK-014] Retry requests the data again and the list replaces the alert", async () => {
    // Arrange
    fetchParksMock
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValueOnce(sample);
    const user = userEvent.setup();
    render(<ParkExplorer />);
    const alert = await screen.findByRole("alert");

    // Act
    await user.click(within(alert).getByRole("button", { name: "Retry" }));
    await parksRegion();

    // Assert
    expect(fetchParksMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(listButtons()).toHaveLength(12);
  });
});

describe("[DES-013][AC-015] empty and unusable data", () => {
  it.each([
    ["an empty array", []],
    ["records that are all unusable", [{ id: "", name: "No id" }, { name: "No id either" }, null]],
  ])(
    "[TEST-035][AC-015][DES-013][TASK-014] shows a distinct message, not a blank screen, for %s",
    async (_label, raw) => {
      // Arrange
      fetchParksMock.mockResolvedValue(raw);

      // Act
      render(<ParkExplorer />);
      const message = await screen.findByText("No parks available.");

      // Assert
      expect(message).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.queryByRole("region", { name: "Parks" })).not.toBeInTheDocument();
      expect(screen.queryByRole("region", { name: "Park details" })).not.toBeInTheDocument();
    },
  );

  it("[TEST-035][AC-015][DES-013][TASK-014] excludes records with a missing id or name and lists the first of a repeated id", async () => {
    // Arrange
    fetchParksMock.mockResolvedValue([
      { id: "", name: "No id" },
      makeRawPark(),
      makeRawPark({ name: "Duplicate Of Prospect" }),
      makeRawPark({}, "riverside-commons"),
      makeRawPark({ id: "blank-name", name: "   " }),
    ]);

    // Act
    render(<ParkExplorer />);
    await parksRegion();

    // Assert
    expect(listButtons().map((button) => button.textContent)).toEqual([
      "Prospect Park",
      "Riverside Commons",
    ]);
  });
});
