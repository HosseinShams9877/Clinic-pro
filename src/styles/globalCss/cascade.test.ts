/**
 * cascade.test.ts — the cascade-layer regression gate (P2 item 6, 2026-11-10).
 *
 * Phase 1 shipped `@import "tailwindcss" layer(utilities)`. Wrapping the import
 * nested Tailwind's internal `@layer base` (preflight: `*{margin:0;padding:0}`)
 * inside the root `utilities` layer, which sorts AFTER `@layer components` —
 * and cascade-layer order beats specificity, so every components-layer rule
 * was silently dead (`.container` gutters measured 0px, `.section` rhythm 0px,
 * content flush with the viewport edge at 393px). These guards pin the fix at
 * the source so the pattern cannot regress.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (name: string) =>
  readFileSync(join(process.cwd(), "src/styles/globalCss", name), "utf8");

describe("the Tailwind import must stay unlayered", () => {
  it("is not wrapped in layer(...)", () => {
    const index = read("index.css");
    expect(index).not.toMatch(/@import\s+"tailwindcss"\s+layer\s*\(/);
  });

  it("is imported bare, so its internal layers merge at the root", () => {
    const index = read("index.css");
    expect(index).toMatch(/@import\s+"tailwindcss"\s*;/);
  });

  it("declares the project layer order before the Tailwind import", () => {
    const index = read("index.css");
    const order = index.indexOf("@layer base, components, utilities;");
    const tailwind = index.indexOf('@import "tailwindcss"');
    expect(order).toBeGreaterThan(-1);
    expect(tailwind).toBeGreaterThan(-1);
    expect(order).toBeLessThan(tailwind);
  });
});

describe("layout.css component rules stay in @layer components", () => {
  it("gives .container its 20px gutters", () => {
    const layout = read("layout.css");
    expect(layout).toMatch(/\.container\s*\{[^}]*padding-inline:\s*20px/);
  });

  it("keeps the .section rhythm (88px base, 56px under 640px)", () => {
    const layout = read("layout.css");
    expect(layout).toMatch(/\.section\s*\{[^}]*padding-block:\s*88px/);
    expect(layout).toMatch(/max-width:\s*639px[^}]*\.section\s*\{[^}]*padding-block:\s*56px/);
  });

  it("ships the 320px overflow guard as a utility", () => {
    const layout = read("layout.css");
    expect(layout).toMatch(/\.clip-x\s*\{[^}]*overflow-x:\s*clip/);
  });
});
