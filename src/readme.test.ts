import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readme = readFileSync(join(__dirname, "..", "README.md"), "utf8");

// Each manual check, with the acceptance criterion it verifies.
const MANUAL_CHECKS: [string, string][] = [
  ["TEST-044", "AC-002"],
  ["TEST-045", "AC-006"],
  ["TEST-046", "AC-013"],
  ["TEST-047", "AC-014"],
  ["TEST-048", "AC-005"],
  ["TEST-049", "AC-008"],
  ["TEST-050", "AC-009"],
  ["TEST-051", "AC-012"],
];

const REQUIRED_HEADINGS = [
  "Install and run",
  "What works",
  "Decisions",
  "Omissions",
  "Known issues",
  "Verification",
  "Before public use",
];

describe("[REQ-F-011][AC-010] README", () => {
  it.each(REQUIRED_HEADINGS)(
    "[TEST-043][AC-010][DES-031][TASK-017] has a '%s' section",
    (heading) => {
      expect(readme).toMatch(new RegExp(`^#{1,3} .*${heading}`, "im"));
    },
  );

  it("[TEST-043][AC-010][DES-031][TASK-017] has no scaffold text", () => {
    expect(readme).not.toMatch(/create-next-app/i);
  });

  it("[TEST-043][AC-010][DES-031][TASK-017] documents only npm scripts that exist", () => {
    const scripts = Object.keys(JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")).scripts);
    const used = [...readme.matchAll(/npm run ([\w:-]+)/g)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(0);
    for (const name of used) expect(scripts).toContain(name);
  });

  it("[TEST-043][AC-010][DES-031][TASK-017] states the OpenStreetMap tile caveat and the placeholder-image note", () => {
    expect(readme).toMatch(/OpenStreetMap/);
    expect(readme).toMatch(/tile[- ]provider/i);
    expect(readme).toMatch(/images\.example\.com/);
  });

  it("[TEST-043][AC-010][DES-031][TASK-017] records the react-leaflet licence outcome", () => {
    expect(readme).toMatch(/react-leaflet/);
    expect(readme).toMatch(/Hippocratic/);
  });

  it.each(MANUAL_CHECKS)(
    "[TEST-043][AC-010][DES-023][TASK-017] lists manual check %s for %s with owner, result and date columns",
    (testId, acId) => {
      const row = readme.split("\n").find((line) => line.startsWith("|") && line.includes(testId));
      expect(row).toBeDefined();
      expect(row).toContain(acId);
      expect(readme).toMatch(/\|\s*Owner\s*\|\s*Result\s*\|\s*Date\s*\|/);
    },
  );
});
