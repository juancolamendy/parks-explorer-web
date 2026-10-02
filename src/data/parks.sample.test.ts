import { describe, expect, it } from "vitest";
import parks from "@/data/parks.sample.json";

describe("[DES-024] test harness", () => {
  it("[TEST-001][DES-024][TASK-001] resolves the @ alias and loads 12 unique, named sample parks", () => {
    // Arrange
    const records = parks;

    // Act
    const ids = records.map((park) => park.id);

    // Assert
    expect(records).toHaveLength(12);
    expect(new Set(ids).size).toBe(12);
    expect(records.every((park) => park.name.trim().length > 0)).toBe(true);
  });
});
