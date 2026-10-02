/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ExplorerLayout } from "@/layouts/ExplorerLayout";

// jsdom has no layout engine, so this guards the DOM-order and class contract
// (SDD F2: tab order must equal visual order). Real viewports are checked manually (AC-006).

afterEach(cleanup);

function renderLayout() {
  return render(
    <ExplorerLayout
      list={<p data-testid="list-slot">list</p>}
      map={<p data-testid="map-slot">map</p>}
      details={<p data-testid="details-slot">details</p>}
    />,
  );
}

const slotWrapper = (testId: string) => screen.getByTestId(testId).parentElement as HTMLElement;
const gridOf = () => slotWrapper("list-slot").parentElement as HTMLElement;

function expectClasses(element: HTMLElement, classes: string[]) {
  for (const name of classes) {
    expect(element.classList.contains(name), `expected class "${name}"`).toBe(true);
  }
}

const allClassTokens = (root: HTMLElement) =>
  [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))].flatMap((element) =>
    Array.from(element.classList),
  );

describe("[DES-020] page landmarks", () => {
  it("[TEST-031][AC-006][DES-020][TASK-013] has exactly one main landmark containing exactly one h1 'Parks Explorer'", () => {
    // Arrange / Act
    renderLayout();

    // Assert
    const mains = screen.getAllByRole("main");
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(mains).toHaveLength(1);
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Parks Explorer");
    expect(mains[0]).toContainElement(headings[0]);
  });

  it("[TEST-031][AC-006][DES-020][TASK-013] renders each slot exactly once inside the main landmark", () => {
    // Arrange / Act
    renderLayout();

    // Assert
    const main = screen.getByRole("main");
    for (const id of ["list-slot", "map-slot", "details-slot"]) {
      expect(screen.getAllByTestId(id)).toHaveLength(1);
      expect(main).toContainElement(screen.getByTestId(id));
    }
  });
});

describe("[DES-010][DES-027] DOM order equals visual order", () => {
  it("[TEST-031][AC-006][DES-010][TASK-013] places the slots in the DOM as list, then map, then details", () => {
    // Arrange / Act
    renderLayout();

    // Assert
    const list = screen.getByTestId("list-slot");
    const map = screen.getByTestId("map-slot");
    const details = screen.getByTestId("details-slot");
    expect(list.compareDocumentPosition(map) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(map.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("[TEST-031][AC-006][DES-027][TASK-013] stacks in one column by default and uses two columns with equal tab and visual order at lg", () => {
    // Arrange / Act
    renderLayout();

    // Assert
    expectClasses(gridOf(), [
      "grid",
      "grid-cols-1",
      "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]",
      "lg:grid-rows-[auto_1fr]",
    ]);
    expectClasses(slotWrapper("list-slot"), ["lg:col-start-1", "lg:row-start-1", "lg:row-span-2"]);
    expectClasses(slotWrapper("map-slot"), ["lg:col-start-2", "lg:row-start-1"]);
    expectClasses(slotWrapper("details-slot"), ["lg:col-start-2", "lg:row-start-2"]);
  });

  it("[TEST-031][AC-006][DES-027][TASK-013] lets every slot shrink so long names cannot cause horizontal scroll", () => {
    // Arrange / Act
    renderLayout();

    // Assert
    for (const id of ["list-slot", "map-slot", "details-slot"]) {
      expect(slotWrapper(id).classList.contains("min-w-0")).toBe(true);
    }
  });

  it("[TEST-031][AC-006][DES-010][TASK-013] uses no reordering utilities that would split tab order from visual order", () => {
    // Arrange / Act
    const { container } = renderLayout();

    // Assert
    const reordering = allClassTokens(container).filter((token) =>
      /(^|:)(order-|flex-row-reverse$|flex-col-reverse$|grid-flow-dense$)/.test(token),
    );
    expect(reordering).toEqual([]);
  });
});

describe("[DES-020] no nested scroll containers", () => {
  it("[TEST-031][AC-006][DES-020][TASK-013] adds no overflow-scroll or overflow-auto container around any slot", () => {
    // Arrange / Act
    const { container } = renderLayout();

    // Assert
    const scrollContainers = allClassTokens(container).filter((token) =>
      /(^|:)overflow(-[xy])?-(auto|scroll)$/.test(token),
    );
    expect(scrollContainers).toEqual([]);
  });
});
