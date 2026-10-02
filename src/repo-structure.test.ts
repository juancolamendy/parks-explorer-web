import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

const FORBIDDEN_DEPENDENCIES = [
  "prisma", "@prisma/client", "mongoose", "mongodb", "pg", "mysql", "mysql2",
  "sqlite3", "better-sqlite3", "typeorm", "sequelize", "drizzle-orm",
  "next-auth", "@auth/core", "passport", "@clerk/nextjs", "firebase",
];

/** Non-test source files under src/, as repo-relative posix paths. */
function sourceFiles(dir = join(ROOT, "src")): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    const isSource = /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name);
    return isSource ? [relative(ROOT, path).split(sep).join("/")] : [];
  });
}

function forbiddenDependencies(pkg: { dependencies?: object; devDependencies?: object }): string[] {
  const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  return names.filter((name) => FORBIDDEN_DEPENDENCIES.includes(name));
}

function importsLeaflet(source: string): boolean {
  return /(?:from|import)\s*\(?\s*["'](?:leaflet|react-leaflet)(?:\/[^"']*)?["']/.test(source);
}

function filesImportingLeaflet(files: Record<string, string>): string[] {
  return Object.keys(files).filter((path) => importsLeaflet(files[path]));
}

function usesGeolocation(source: string): boolean {
  return /geolocation/i.test(source);
}

/** The explorer must load the map through `dynamic` with `ssr: false`, never a static import. */
function mapLoadingProblems(source: string): string[] {
  const problems: string[] = [];
  if (/^\s*import\s[^;]*["']@\/components\/ParkMap["']/m.test(source)) problems.push("static import of ParkMap");
  if (!/dynamic\(\s*\(\)\s*=>\s*import\(\s*["']@\/components\/ParkMap["']\s*\)\s*,\s*\{[^}]*\bssr:\s*false\b/.test(source)) {
    problems.push("ParkMap is not loaded through dynamic with ssr: false");
  }
  return problems;
}

describe("[AC-015][CON-003][CON-005] repository structure", () => {
  it("[TEST-052][AC-015][DES-019][TASK-018] has ParkList, ParkDetails and ParkMap under src/components", () => {
    for (const name of ["ParkList", "ParkDetails", "ParkMap"]) {
      expect(existsSync(join(ROOT, "src/components", `${name}.tsx`)), name).toBe(true);
    }
  });

  it("[TEST-052][AC-015][DES-019][TASK-018] ParkMap carries the OpenStreetMap attribution", () => {
    expect(read("src/components/ParkMap.tsx")).toMatch(/OpenStreetMap/);
  });

  it("[TEST-052][AC-015][DES-019][TASK-018] has no database or auth dependency", () => {
    expect(forbiddenDependencies(JSON.parse(read("package.json")))).toEqual([]);
  });

  it("[TEST-052][AC-015][DES-019][TASK-018] flags a synthetic database dependency", () => {
    expect(forbiddenDependencies({ dependencies: { prisma: "^6", next: "16" }, devDependencies: { "next-auth": "5" } }))
      .toEqual(["prisma", "next-auth"]);
  });
});

describe("[AC-007] no geolocation", () => {
  it("[TEST-053][AC-007][DES-019][TASK-018] no non-test source file uses geolocation", () => {
    const files = sourceFiles();

    expect(files.length).toBeGreaterThan(10);
    expect(files.filter((path) => usesGeolocation(read(path)))).toEqual([]);
  });

  it("[TEST-053][AC-007][DES-019][TASK-018] flags a synthetic navigator.geolocation call", () => {
    expect(usesGeolocation("navigator.geolocation.getCurrentPosition(cb)")).toBe(true);
    expect(usesGeolocation("const place = park.location")).toBe(false);
  });
});

describe("[DES-019] Leaflet stays inside ParkMap and the map is client-only", () => {
  it("[TEST-055][DES-019][TASK-018] only src/components/ParkMap.tsx imports leaflet or react-leaflet", () => {
    const files = Object.fromEntries(sourceFiles().map((path) => [path, read(path)]));

    expect(filesImportingLeaflet(files)).toEqual(["src/components/ParkMap.tsx"]);
  });

  it("[TEST-055][DES-019][TASK-018] flags a synthetic Leaflet import in lib/", () => {
    const files = {
      "src/lib/bad.ts": 'import { map } from "leaflet";',
      "src/lib/bad2.ts": 'import { MapContainer } from "react-leaflet";',
      "src/lib/css.ts": 'import "leaflet/dist/leaflet.css";',
      "src/lib/fine.ts": 'import { x } from "@/lib/leafletHelpers";',
    };

    expect(filesImportingLeaflet(files)).toEqual(["src/lib/bad.ts", "src/lib/bad2.ts", "src/lib/css.ts"]);
  });

  it("[TEST-055][DES-019][TASK-018] ParkExplorer loads ParkMap through dynamic with ssr: false", () => {
    expect(mapLoadingProblems(read("src/components/ParkExplorer.tsx"))).toEqual([]);
  });

  it("[TEST-055][DES-019][TASK-018] flags dynamic without ssr: false and a static ParkMap import", () => {
    const noSsr = 'const ParkMap = dynamic(() => import("@/components/ParkMap"), { loading: () => null });';
    const withSsrTrue = 'const ParkMap = dynamic(() => import("@/components/ParkMap"), { ssr: true });';
    const staticImport = 'import ParkMap from "@/components/ParkMap";';

    expect(mapLoadingProblems(noSsr)).toEqual(["ParkMap is not loaded through dynamic with ssr: false"]);
    expect(mapLoadingProblems(withSsrTrue)).toEqual(["ParkMap is not loaded through dynamic with ssr: false"]);
    expect(mapLoadingProblems(staticImport)).toEqual([
      "static import of ParkMap",
      "ParkMap is not loaded through dynamic with ssr: false",
    ]);
  });
});
