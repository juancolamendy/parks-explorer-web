/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import sample from "@/data/parks.sample.json";
import ParkList from "@/components/ParkList";
import { makeRawPark } from "@/lib/fixtures/makePark";
import { normalizeParks } from "@/lib/parks";

const sampleParks = normalizeParks(sample);

afterEach(cleanup);

function renderList(
  options: { parks?: typeof sampleParks; selectedParkId?: string | null } = {},
) {
  const onSelect = vi.fn();
  const utils = render(
    <ParkList
      parks={options.parks ?? sampleParks}
      selectedParkId={options.selectedParkId ?? null}
      onSelect={onSelect}
    />,
  );
  return { onSelect, ...utils };
}

const parkButtons = () => screen.getAllByRole("button");

describe("[DES-003][AC-001] list rendering and selection state", () => {
  it("[TEST-023][AC-001][DES-003][TASK-010] renders a labelled Parks region with one button per park, in order", () => {
    // Arrange / Act
    renderList();

    // Assert
    const region = screen.getByRole("region", { name: "Parks" });
    const items = within(region).getAllByRole("listitem");
    expect(items).toHaveLength(12);
    expect(parkButtons().map((button) => button.textContent)).toEqual(
      sampleParks.map((park) => park.name),
    );
  });

  it("[TEST-023][AC-001][DES-003][TASK-010] marks nothing as current when no park is selected", () => {
    // Arrange / Act
    renderList({ selectedParkId: null });

    // Assert
    for (const button of parkButtons()) {
      expect(button).not.toHaveAttribute("aria-current");
    }
  });

  it("[TEST-023][AC-001][DES-003][TASK-010] marks exactly the selected park as current, with a non-colour cue", () => {
    // Arrange / Act
    renderList({ selectedParkId: "riverside-commons" });

    // Assert
    const current = parkButtons().filter(
      (button) => button.getAttribute("aria-current") === "true",
    );
    expect(current.map((button) => button.textContent)).toEqual(["Riverside Commons"]);
    expect(current[0]).toHaveClass("border-l-8", "font-semibold");
    for (const button of parkButtons().filter((b) => b !== current[0])) {
      expect(button).not.toHaveAttribute("aria-current");
      expect(button).not.toHaveClass("border-l-8");
      expect(button).not.toHaveClass("font-semibold");
    }
  });

  it("[TEST-023][AC-001][DES-003][TASK-010] marks nothing as current when the selected id matches no park", () => {
    // Arrange / Act
    renderList({ selectedParkId: "no-such-park" });

    // Assert
    for (const button of parkButtons()) {
      expect(button).not.toHaveAttribute("aria-current");
    }
  });

  it("[TEST-023][AC-001][DES-003][TASK-010] calls onSelect with the park's id when its button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onSelect } = renderList();

    // Act
    await user.click(screen.getByRole("button", { name: "Highland Dog Park" }));

    // Assert
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("highland-dog-park");
  });

  it("[TEST-023][AC-001][DES-003][TASK-010] renders the heading and no buttons for an empty list", () => {
    // Arrange / Act
    renderList({ parks: [] });

    // Assert
    expect(screen.getByRole("heading", { name: "Parks" })).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toEqual([]);
  });

  it("[TEST-023][AC-001][DES-020][TASK-010] lets long names wrap and adds no nested scroll container", () => {
    // Arrange
    const longName = "Extraordinarily".repeat(20);
    const parks = normalizeParks([makeRawPark({ id: "long", name: longName })]);

    // Act
    const { container } = renderList({ parks });

    // Assert
    const [button] = parkButtons();
    expect(button).toHaveClass("break-words", "min-w-0");
    expect(container.querySelector('[class*="overflow-"]')).toBeNull();
  });

  it("[TEST-023][AC-001][DES-019][TASK-010] renders a hostile park name as plain text, not markup", () => {
    // Arrange
    const hostile = '<img src=x onerror="alert(1)">';
    const parks = normalizeParks([makeRawPark({ id: "hostile", name: hostile })]);

    // Act
    const { container } = renderList({ parks });

    // Assert
    expect(screen.getByRole("button", { name: hostile })).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });
});

describe("[DES-003][AC-005] keyboard activation", () => {
  it("[TEST-024][AC-005][DES-003][TASK-010] the first Tab lands on the first park button without selecting it", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onSelect } = renderList();

    // Act
    await user.tab();

    // Assert
    expect(parkButtons()[0]).toHaveFocus();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("[TEST-024][AC-005][DES-003][TASK-010] Tab moves through the buttons in list order", async () => {
    // Arrange
    const user = userEvent.setup();
    renderList();

    // Act
    await user.tab();
    await user.tab();
    await user.tab();

    // Assert
    expect(parkButtons()[2]).toHaveFocus();
  });

  it("[TEST-024][AC-005][DES-003][TASK-010] Enter selects the focused park", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onSelect } = renderList();
    await user.tab();

    // Act
    await user.keyboard("{Enter}");

    // Assert
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(sampleParks[0].id);
  });

  it("[TEST-024][AC-005][DES-003][TASK-010] Space selects the focused park", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onSelect } = renderList();
    await user.tab();
    await user.tab();

    // Act
    await user.keyboard(" ");

    // Assert
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(sampleParks[1].id);
  });

  it("[TEST-024][AC-005][DES-003][TASK-010] activating the already selected park reports it again", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onSelect } = renderList({ selectedParkId: sampleParks[0].id });
    await user.tab();

    // Act
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    // Assert
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenNthCalledWith(1, sampleParks[0].id);
    expect(onSelect).toHaveBeenNthCalledWith(2, sampleParks[0].id);
  });

  it("[TEST-024][AC-005][DES-020][TASK-010] every park button carries the focus-visible ring classes", () => {
    // Arrange / Act
    renderList({ selectedParkId: sampleParks[0].id });

    // Assert
    for (const button of parkButtons()) {
      expect(button).toHaveClass(
        "focus-visible:ring-2",
        "focus-visible:ring-green-700",
        "focus-visible:ring-offset-2",
      );
    }
  });
});
