/**
 * @vitest-environment node
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as route from "@/app/api/parks/route";

// Read from disk (not via the route's own import) so the comparison is not a value compared to itself.
const sampleFile = fileURLToPath(
  new URL("../../../data/parks.sample.json", import.meta.url),
);
const readSample = (): Array<Record<string, unknown>> =>
  JSON.parse(readFileSync(sampleFile, "utf8"));

describe("[DES-016][AC-009] GET /api/parks", () => {
  it("[TEST-029][AC-009][DES-016][TASK-012] responds 200 with a JSON content type", async () => {
    // Arrange / Act
    const response = await route.GET();

    // Assert
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("[TEST-029][AC-009][DES-016][TASK-012] returns a body equal to the sample file read from disk", async () => {
    // Arrange
    const expected = readSample();

    // Act
    const body = await (await route.GET()).json();

    // Assert
    expect(body).toEqual(expected);
  });

  it("[TEST-029][AC-009][DES-016][TASK-012] does not filter or reshape the records", async () => {
    // Arrange
    const expected = readSample();

    // Act
    const body: Array<Record<string, unknown>> = await (await route.GET()).json();

    // Assert
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(12);
    expect(body.map((record) => Object.keys(record).sort())).toEqual(
      expected.map((record) => Object.keys(record).sort()),
    );
  });

  it("[TEST-029][AC-009][DES-016][TASK-012] serves a fresh response on every call", async () => {
    // Arrange / Act
    const first = await route.GET();
    const second = await route.GET();

    // Assert
    expect(second).not.toBe(first);
    expect(await second.json()).toEqual(await first.json());
  });
});

describe("[DES-016] method surface", () => {
  it("[TEST-030][DES-016][TASK-012] exports GET and no mutating methods", () => {
    // Arrange / Act
    const exported = Object.keys(route);

    // Assert
    expect(exported).toContain("GET");
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(exported).not.toContain(method);
    }
  });
});
