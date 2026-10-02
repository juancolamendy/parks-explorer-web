import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..");
const SELF = relative(ROOT, __filename);

/** Every AC id the requirements define, from the `- AC-001 (US-...` list items. */
function definedAcs(requirements: string): string[] {
  return [...requirements.matchAll(/^- (AC-\d{3}) \(/gm)].map((match) => match[1]);
}

/** AC ids named in a test title, i.e. a `[AC-001]` tag on a line that also has a `[TEST-` tag. */
function acsInTestTitles(source: string): string[] {
  return source
    .split("\n")
    .filter((line) => line.includes("[TEST-"))
    .flatMap((line) => [...line.matchAll(/\[(AC-\d{3})\]/g)].map((match) => match[1]));
}

/** AC ids on README checklist table rows (`| TEST-044 | AC-002 | ...`). */
function acsInChecklist(readme: string): string[] {
  return readme
    .split("\n")
    .filter((line) => /^\|\s*TEST-\d{3}\s*\|/.test(line))
    .flatMap((line) => [...line.matchAll(/\bAC-\d{3}\b/g)].map((match) => match[0]));
}

function uncovered(acs: string[], testSources: string[], readme: string): string[] {
  const covered = new Set([...testSources.flatMap(acsInTestTitles), ...acsInChecklist(readme)]);
  return acs.filter((ac) => !covered.has(ac));
}

function testFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return testFiles(path);
    return /\.test\.tsx?$/.test(entry.name) && relative(ROOT, path) !== SELF ? [path] : [];
  });
}

describe("[DES-023] every acceptance criterion has a verifier", () => {
  it("[TEST-054][DES-023][TASK-018] reports an AC that has neither a test title nor a checklist row", () => {
    const sources = ['it("[TEST-001][AC-001] works", () => {});'];
    const readme = "| TEST-044 | AC-002 | check | owner | pending | — |";

    expect(uncovered(["AC-001", "AC-002", "AC-999"], sources, readme)).toEqual(["AC-999"]);
  });

  it("[TEST-054][DES-023][TASK-018] does not count an AC mentioned outside a test title or checklist row", () => {
    const sources = ["// AC-003 is only mentioned in a comment", 'it("[AC-004] has no TEST tag", () => {});'];

    expect(uncovered(["AC-003", "AC-004"], sources, "AC-003 and AC-004 in prose")).toEqual(["AC-003", "AC-004"]);
  });

  it("[TEST-054][DES-023][TASK-018] finds the AC ids in the requirements", () => {
    const acs = definedAcs(readFileSync(join(ROOT, "docs/requirement/requirements.md"), "utf8"));

    expect(acs).toHaveLength(15);
    expect(acs[0]).toBe("AC-001");
    expect(acs[14]).toBe("AC-015");
  });

  it("[TEST-054][DES-023][TASK-018] every AC in the requirements has a test title or a README checklist row", () => {
    const acs = definedAcs(readFileSync(join(ROOT, "docs/requirement/requirements.md"), "utf8"));
    const sources = testFiles(join(ROOT, "src")).map((file) => readFileSync(file, "utf8"));
    const readme = readFileSync(join(ROOT, "README.md"), "utf8");

    expect(sources.length).toBeGreaterThan(0);
    expect(uncovered(acs, sources, readme)).toEqual([]);
  });

  it("[TEST-054][DES-023][TASK-018] scans test files only, never this guard itself", () => {
    const files = testFiles(join(ROOT, "src")).map((file) => relative(ROOT, file).split(sep).join("/"));

    expect(files).toContain("src/readme.test.ts");
    expect(files).not.toContain(SELF.split(sep).join("/"));
  });
});
