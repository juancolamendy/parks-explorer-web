import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import ParkExplorer from "@/components/ParkExplorer";
import { metadata } from "@/app/layout";
import Home from "@/app/page";

// next/font/google fetches at build time and needs the Next compiler, so it is stubbed (assumption A9).
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-geist-sans" }),
  Geist_Mono: () => ({ variable: "font-geist-mono" }),
}));

const css = readFileSync(join(__dirname, "globals.css"), "utf8");

describe("[DES-020][DES-021] app shell", () => {
  it("[TEST-042][DES-020][TASK-016] sets the real title and description, not the scaffold's", () => {
    expect(metadata.title).toBe("Parks Explorer");
    expect(typeof metadata.description).toBe("string");
    expect(metadata.description).not.toMatch(/create next app/i);
    expect(metadata.description).not.toBe("");
  });

  it("[TEST-042][DES-021][TASK-016] is light only: color-scheme light and no dark media block", () => {
    expect(css).toMatch(/color-scheme:\s*light/);
    expect(css).not.toMatch(/prefers-color-scheme:\s*dark/);
  });

  it("[TEST-042][DES-001][TASK-016] the home page renders the ParkExplorer and no scaffold content", () => {
    const element = Home();
    expect(element.type).toBe(ParkExplorer);
    expect(JSON.stringify(element)).not.toMatch(/create-next-app|next\.svg|vercel/i);
  });
});
