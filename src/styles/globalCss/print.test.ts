/**
 * print.test.ts — the print stylesheet gate (Phase 2, item 5).
 *
 * The guarantee has two halves, and both are checked against the actual CSS
 * source (the same read-a-file-and-assert pattern the catalog parity test uses
 * for the reference):
 *   1. the stylesheet EXISTS and is actually imported by the app's CSS entry,
 *   2. every rule in it sits inside `@media print` — print CSS can never change
 *      the on-screen rendering, which is what makes it "scoped",
 *   3. the four hard requirements are present: the screen-only chrome is
 *      dropped, scroll-reveal cannot blank the page, the surface flattens to
 *      paper (tokens, not a reskin), and internal links print their target.
 *
 * jsdom cannot render @media print, so the assertions are structural — they
 * pin the source, and a live print of every route was observed in the browser
 * during Phase 2 (see PHASE_2_REPORT.md item 5).
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CSS_DIR = resolve(dirname(fileURLToPath(import.meta.url)));
const read = (file: string) => readFileSync(resolve(CSS_DIR, file), "utf8");

/** Strip /* … *​/ comments so commented braces cannot confuse the parser. */
function withoutComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Extract the bodies of every `@media print { … }` block (brace matched). */
function mediaPrintBodies(source: string) {
  const bodies: string[] = [];
  const pattern = /@media\s+print\s*\{/g;
  for (let match = pattern.exec(source); match !== null; match = pattern.exec(source)) {
    let depth = 1;
    let cursor = pattern.lastIndex;
    while (depth > 0 && cursor < source.length) {
      if (source[cursor] === "{") depth += 1;
      else if (source[cursor] === "}") depth -= 1;
      cursor += 1;
    }
    bodies.push(source.slice(pattern.lastIndex, cursor - 1));
  }
  return bodies;
}

/** Text with every `@media print { … }` block removed. */
function withoutPrintBlocks(source: string) {
  let result = source;
  for (const body of mediaPrintBodies(source)) {
    result = result.replace(`@media print{${body}}`, "").replace(`@media print {${body}}`, "");
  }
  return result;
}

describe("the print stylesheet (P2 item 5)", () => {
  it("is imported by the app's CSS entry", () => {
    const entry = withoutComments(read("index.css"));
    expect(entry).toMatch(/@import\s+".\/print\.css"/);
  });

  it("contains no rule at all outside @media print — it cannot touch the screen", () => {
    const source = withoutComments(read("print.css"));
    expect(source).toMatch(/@media\s+print\s*\{/);
    const outside = withoutPrintBlocks(source)
      .replace(/@media\s+print\s*\{/g, "")
      .replace(/[@\w\s().,:>"#=^-]/g, "");
    // Any residual declaration (`prop: value;`) or rule block out here is a
    // scoping bug: the file would leak into the on-screen cascade.
    expect(outside).not.toMatch(/[:{}]/);
  });

  it("drops the screen-only chrome", () => {
    const print = withoutComments(read("print.css"));
    const hidden = /\.site-header[\s\S]*?\.scroll-progress[\s\S]*?\.float-actions[\s\S]*?\{[\s\S]*?display:\s*none/;
    expect(print, "the screen-only chrome selectors are not hidden together").toMatch(hidden);
    expect(print, ".skip-link not hidden").toMatch(/\.skip-link\s*\{[\s\S]*?display:\s*none/);
  });

  it("forces scroll-revealed content visible so print cannot emit blank regions", () => {
    const print = withoutComments(read("print.css"));
    expect(print).toMatch(/\.fx\s*\[data-reveal\]\s*\{[^}]*opacity:\s*1/);
  });

  it("flattens the surface via tokens, and leaves text-primary's color dark", () => {
    const print = withoutComments(read("print.css"));
    expect(print).toMatch(/--bg:\s*#fff/);
    expect(print).toMatch(/--color-accent-strong:\s*#e8f3f4/);
    // The flip must target the theme alias only: the semantic --accent-strong
    // stays dark because text-primary resolves through it.
    expect(print).not.toMatch(/--accent-strong:\s*#/);
  });

  it("prints the target path after internal links and keeps blocks whole", () => {
    const print = withoutComments(read("print.css"));
    // The ::after rule must print the target path after the label. Asserted on
    // the block text directly (not a regex) so the whitespace of a hand-authored
    // declaration cannot make a correct rule fail.
    const selector = 'main a[href^="/"]::after';
    const start = print.indexOf(selector);
    expect(start, `${selector} rule missing`).toBeGreaterThanOrEqual(0);
    const end = print.indexOf("}", start);
    const afterRule = print.slice(start, end);
    expect(afterRule).toContain("content:");
    expect(afterRule).toContain("attr(href)");
    expect(afterRule).toContain("(");

    expect(print).toMatch(/break-inside:\s*avoid/);
    expect(print).toMatch(/break-after:\s*avoid/);
  });
});
