/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import sample from "@/data/parks.sample.json";
import ParkDetails from "@/components/ParkDetails";
import { makeRawPark } from "@/lib/fixtures/makePark";
import { formatAmenity } from "@/lib/format";
import { normalizeParks } from "@/lib/parks";
import type { Park } from "@/lib/types";

const PROMPT = "Select a park from the list or map to see its details";

/** Normalizes one sample record exactly as the app does. */
function samplePark(id: string): Park {
  const [park] = normalizeParks([makeRawPark({}, id)]);
  return park;
}

function sampleRecord(id: string) {
  const record = sample.find((item) => item.id === id);
  if (!record) throw new Error(`no sample record ${id}`);
  return record;
}

/** Every piece of text the panel shows (text of elements that have no child elements). */
function visibleTexts(root: HTMLElement): string[] {
  return [...root.querySelectorAll("*")]
    .filter((element) => element.children.length === 0)
    .map((element) => element.textContent?.trim() ?? "")
    .filter((text) => text !== "");
}

const STATIC_LABELS = new Set([
  "Address",
  "Hours",
  "Description",
  "Amenities",
  "Photos",
  "Address not provided",
  "Hours not provided",
  "Description not provided",
  "Acreage not provided",
  "No amenities listed",
  "No photos provided",
  "Rating not provided",
]);

afterEach(() => {
  cleanup();
});

describe("[DES-004][AC-011] a fully populated park", () => {
  it("[TEST-025][AC-011][DES-004][TASK-011] shows the supplied facts, verbatim or formatted, and nothing more", () => {
    // Arrange
    const park = samplePark("prospect-park");
    const record = sampleRecord("prospect-park");

    // Act
    render(<ParkDetails park={park} />);

    // Assert
    expect(screen.getByRole("heading", { level: 2, name: "Prospect Park" })).toBeInTheDocument();
    expect(screen.getByText("Brooklyn, NY 11225")).toBeInTheDocument();
    expect(screen.getByText("6:00 AM - 1:00 AM")).toBeInTheDocument();
    expect(screen.getByText(record.description as string)).toBeInTheDocument();
    expect(screen.getByText("526 acres")).toBeInTheDocument();
    expect(screen.getByText("Rating: 4.7")).toBeInTheDocument();
  });

  it("[TEST-025][AC-011][DES-004][TASK-011] lists each amenity once as a formatted label, with none added or dropped", () => {
    // Arrange
    const park = samplePark("prospect-park");
    const expected = sampleRecord("prospect-park").amenities.map((slug) => formatAmenity(slug));

    // Act
    render(<ParkDetails park={park} />);

    // Assert
    const items = within(screen.getByRole("list", { name: "Amenities" })).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(expected);
    expect(items.map((item) => item.textContent)).toEqual([
      "Playground",
      "Dog run",
      "Trails",
      "Restrooms",
      "Parking",
      "Lake",
      "Picnic areas",
    ]);
  });

  it("[TEST-025][AC-011][DES-004][TASK-011] shows one image per supplied URL with alt text built from the park name only", () => {
    // Arrange
    const park = samplePark("prospect-park");

    // Act
    render(<ParkDetails park={park} />);

    // Assert
    const images = screen.getAllByRole("img");
    expect(images.map((image) => image.getAttribute("alt"))).toEqual([
      "Photo 1 of Prospect Park",
      "Photo 2 of Prospect Park",
    ]);
    expect(images.map((image) => image.getAttribute("src"))).toEqual(sampleRecord("prospect-park").images);
  });

  it("[TEST-025][AC-011][DES-004][TASK-011] adds no rating scale, review count, or other unsupplied claim", () => {
    // Arrange
    const park = samplePark("prospect-park");

    // Act
    const { container } = render(<ParkDetails park={park} />);

    // Assert
    expect(container).not.toHaveTextContent("/5");
    expect(container).not.toHaveTextContent("/ 5");
    expect(container).not.toHaveTextContent(/review/i);
    expect(container).not.toHaveTextContent(/open now|closed/i);
  });
});

describe("[DES-004][AC-004] sparse parks", () => {
  it.each([
    ["old-mill-botanical-garden", ["Description not provided"], []],
    ["highland-dog-park", ["Address not provided"], []],
    ["cedar-hill-nature-preserve", ["No photos provided", "Rating not provided"], []],
  ])(
    "[TEST-026][AC-004][DES-004][TASK-011] renders %s with explicit not-provided labels",
    (id, presentLabels) => {
      // Arrange
      const park = samplePark(id);

      // Act
      render(<ParkDetails park={park} />);

      // Assert
      expect(screen.getByRole("heading", { level: 2, name: park.name })).toBeInTheDocument();
      for (const label of presentLabels) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
    },
  );

  it("[TEST-026][AC-004][DES-004][TASK-011] shows the other supplied facts of a sparse park unchanged", () => {
    // Arrange
    const oldMill = samplePark("old-mill-botanical-garden");

    // Act
    render(<ParkDetails park={oldMill} />);

    // Assert
    expect(screen.getByText("12 Old Mill Ln")).toBeInTheDocument();
    expect(screen.getByText("Rating: 4.6")).toBeInTheDocument();
    expect(screen.getByText("34 acres")).toBeInTheDocument();
    expect(screen.queryByText("No photos provided")).not.toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it.each(["old-mill-botanical-garden", "highland-dog-park", "cedar-hill-nature-preserve"])(
    "[TEST-026][AC-004][DES-004][TASK-011] shows only text that comes from the park record or a fixed label (%s)",
    (id) => {
      // Arrange
      const park = samplePark(id);
      const record = sampleRecord(id);
      const allowed = new Set<string>([
        ...STATIC_LABELS,
        park.name,
        ...(record.description ? [record.description] : []),
        ...(record.location.address ? [record.location.address] : []),
        record.hours,
        `${record.acreage} acres`,
        ...(record.rating === null ? [] : [`Rating: ${record.rating}`]),
        ...record.amenities.map((slug) => formatAmenity(slug) as string),
      ]);

      // Act
      const { container } = render(<ParkDetails park={park} />);

      // Assert
      const unexpected = visibleTexts(container).filter((text) => !allowed.has(text));
      expect(unexpected).toEqual([]);
    },
  );

  it("[TEST-026][AC-004][DES-004][TASK-011] labels a missing hours value, acreage, and an empty amenity list without crashing", () => {
    // Arrange
    const [bare] = normalizeParks([
      makeRawPark({ hours: undefined, acreage: undefined, amenities: [], images: [], rating: null }),
    ]);

    // Act
    render(<ParkDetails park={bare} />);

    // Assert
    expect(screen.getByText("Hours not provided")).toBeInTheDocument();
    expect(screen.getByText("Acreage not provided")).toBeInTheDocument();
    expect(screen.getByText("No amenities listed")).toBeInTheDocument();
    expect(screen.getByText("No photos provided")).toBeInTheDocument();
    expect(screen.getByText("Rating not provided")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Amenities" })).not.toBeInTheDocument();
  });
});

describe("[DES-004][AC-004] repeated values in untrusted data", () => {
  it("[TEST-026][AC-004][DES-004][TASK-011] shows repeated amenities and image URLs without React key warnings", () => {
    // Arrange
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const [park] = normalizeParks([
      makeRawPark({
        amenities: ["trails", "trails", "wild-life", "wild--life"],
        images: ["https://images.example.com/a.jpg", "https://images.example.com/a.jpg"],
      }),
    ]);

    // Act
    render(<ParkDetails park={park} />);

    // Assert
    expect(errorSpy).not.toHaveBeenCalled();
    expect(within(screen.getByRole("list", { name: "Amenities" })).getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getAllByRole("img")).toHaveLength(2);
    errorSpy.mockRestore();
  });
});

describe("[DES-004][AC-004] images that fail to load, and untrusted text", () => {
  it("[TEST-027][AC-004][DES-004][TASK-011] replaces only the failed image with a same-size fallback", () => {
    // Arrange
    render(<ParkDetails park={samplePark("prospect-park")} />);
    const first = screen.getByAltText("Photo 1 of Prospect Park");
    const secondBefore = screen.getByAltText("Photo 2 of Prospect Park");
    const secondBox = secondBefore.parentElement;

    // Act
    fireEvent.error(first);

    // Assert
    expect(screen.getByText("Image could not be loaded")).toBeInTheDocument();
    expect(screen.queryByAltText("Photo 1 of Prospect Park")).not.toBeInTheDocument();
    expect(screen.getByAltText("Photo 2 of Prospect Park")).toBe(secondBefore);
    const fallbackBox = screen.getByText("Image could not be loaded").parentElement;
    expect(fallbackBox).toHaveClass("aspect-video");
    expect(secondBox).toHaveClass("aspect-video");
  });

  it("[TEST-027][AC-004][DES-004][TASK-011] shows a fallback for every failed image", () => {
    // Arrange
    render(<ParkDetails park={samplePark("prospect-park")} />);

    // Act
    for (const image of screen.getAllByRole("img")) fireEvent.error(image);

    // Assert
    expect(screen.getAllByText("Image could not be loaded")).toHaveLength(2);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("[TEST-027][DES-019][TASK-011] loads images lazily and without a referrer", () => {
    // Arrange / Act
    render(<ParkDetails park={samplePark("prospect-park")} />);

    // Assert
    for (const image of screen.getAllByRole("img")) {
      expect(image).toHaveAttribute("loading", "lazy");
      expect(image).toHaveAttribute("referrerpolicy", "no-referrer");
    }
  });

  it("[TEST-027][DES-019][TASK-011] renders markup in a park name or description as plain text", () => {
    // Arrange
    const hostile = "<img src=x onerror=alert(1)> Park";
    const [park] = normalizeParks([
      makeRawPark({ name: hostile, description: "<script>alert(1)</script>", images: [] }),
    ]);

    // Act
    const { container } = render(<ParkDetails park={park} />);

    // Assert
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(hostile);
    expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(container.querySelectorAll("script")).toHaveLength(0);
  });
});

describe("[DES-004] nothing selected, and the heading as a focus target", () => {
  it("[TEST-028][DES-004][TASK-011] shows the Park details heading and the neutral prompt when no park is selected", () => {
    // Arrange / Act
    const { container } = render(<ParkDetails park={undefined} />);

    // Assert
    expect(screen.getByRole("heading", { level: 2, name: "Park details" })).toBeInTheDocument();
    expect(screen.getByText(PROMPT)).toBeInTheDocument();
    expect(container.querySelector("dl")).toBeNull();
    expect(screen.queryAllByRole("list")).toHaveLength(0);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("[TEST-028][DES-004][TASK-011] makes the heading programmatically focusable and attaches the ref, selected or not", () => {
    // Arrange
    const ref = createRef<HTMLHeadingElement>();

    // Act
    const { rerender } = render(<ParkDetails park={undefined} headingRef={ref} />);
    const emptyHeading = screen.getByRole("heading", { level: 2 });

    // Assert
    expect(emptyHeading).toHaveAttribute("tabindex", "-1");
    expect(ref.current).toBe(emptyHeading);

    rerender(<ParkDetails park={samplePark("prospect-park")} headingRef={ref} />);
    const parkHeading = screen.getByRole("heading", { level: 2 });
    expect(parkHeading).toHaveAttribute("tabindex", "-1");
    expect(ref.current).toBe(parkHeading);
    parkHeading.focus();
    expect(document.activeElement).toBe(parkHeading);
  });

  it("[TEST-028][DES-004][TASK-011] labels the region with the heading text", () => {
    // Arrange
    const { rerender } = render(<ParkDetails park={undefined} />);

    // Assert
    expect(screen.getByRole("region", { name: "Park details" })).toBeInTheDocument();

    // Act
    rerender(<ParkDetails park={samplePark("riverside-commons")} />);

    // Assert
    expect(screen.getByRole("region", { name: "Riverside Commons" })).toBeInTheDocument();
  });
});
