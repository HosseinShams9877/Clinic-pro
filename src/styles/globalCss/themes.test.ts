/**
 * themes.test.ts — the dark-mode / focus-indicator gate (Phase 2, item 6).
 *
 * The dark scheme is token-driven, so its guarantee is structural: every
 * themeable name that paints a surface or a text colour must flip inside the
 * prefers-color-scheme media block, and the focus indicator must be a
 * self-flipping two-ring pair (outline = --fg, halo = --bg).
 *
 * These assertions pin the SOURCE of themes.css and typography.css; the live
 * evidence — a DOM contrast walk in dark on four routes and a focus-ring probe
 * measuring the ring against every adjacent background, in light and dark —
 * was observed in the browser during Phase 2 (see PHASE_2_REPORT.md item 6).
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CSS_DIR = resolve(dirname(fileURLToPath(import.meta.url)));
const read = (file: string) => readFileSync(resolve(CSS_DIR, file), "utf8");

/** Text with comments removed so commented braces cannot confuse the parser. */
function withoutComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** The body of the first `selector { … }` rule in the source (brace matched). */
function ruleBody(source: string, selector: string) {
  const start = source.indexOf(selector);
  expect(start, `${selector} not found`).toBeGreaterThanOrEqual(0);
  expect(source.slice(start + selector.length).trim()[0], `${selector} must open a block`).toBe("{");
  let depth = 0;
  let cursor = source.indexOf("{", start);
  for (; cursor < source.length; cursor += 1) {
    if (source[cursor] === "{") depth += 1;
    else if (source[cursor] === "}") depth -= 1;
    if (depth === 0) return source.slice(source.indexOf("{", start) + 1, cursor);
  }
  return "";
}

describe("the dark scheme and focus indicator (P2 item 6)", () => {
  it("declares the supported schemes so native chrome follows the OS", () => {
    const root = ruleBody(withoutComments(read("themes.css")), ":root");
    expect(root).toMatch(/color-scheme:\s*light\s+dark/);
  });

  it("routes the focus ring through the semantic fg/bg pair, not the raw accent", () => {
    const themes = withoutComments(read("themes.css"));
    const root = ruleBody(themes, ":root");
    expect(root).toMatch(/--focus-ring:\s*var\(--fg\)/);
    expect(root).toMatch(/--focus-halo:\s*var\(--bg\)/);
    // The old single ring never flipped: it was the raw accent in both schemes.
    expect(root).not.toMatch(/--focus-ring:\s*var\(--c-accent\)/);
    expect(root).not.toMatch(/--focus-halo:\s*var\(--c-/);
  });

  it("flips the fg/bg pair the focus ring rides on, so the ring self-flips", () => {
    const themes = withoutComments(read("themes.css"));
    const dark = ruleBody(themes, "@media (prefers-color-scheme: dark)");
    const darkRoot = ruleBody(dark, ":root");
    for (const token of ["--bg", "--surface", "--surface-alt", "--fg", "--fg-muted", "--fg-inverted", "--border", "--accent-strong", "--accent-ink", "--primary-50"]) {
      expect(darkRoot, `${token} does not flip in dark`).toMatch(new RegExp(`${token}:`));
    }
    // A light value left in --fg would make the ring invisible in dark.
    expect(darkRoot).toMatch(/--fg:\s*#e8f3f4/);
    expect(darkRoot).toMatch(/--bg:\s*#0b1c22/);
  });

  it("draws the two-ring indicator with no layout side effects", () => {
    const typography = withoutComments(read("typography.css"));
    const focus = ruleBody(typography, ":focus-visible");
    expect(focus).toMatch(/outline:\s*2px\s+solid\s+var\(--focus-ring\)/);
    expect(focus).toMatch(/box-shadow:\s*0 0 0 2px\s+var\(--focus-halo\)/);
    expect(focus).toMatch(/outline-offset:\s*3px/);
    // border-radius on :focus-visible reshaped the element itself while
    // focused (a rounded-full pill was squashed to 8px). The outline follows
    // the element's own radius; nothing should override it on focus.
    expect(focus).not.toMatch(/border-radius/);
  });
});
