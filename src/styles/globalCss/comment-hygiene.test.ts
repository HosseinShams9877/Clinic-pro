/**
 * comment-hygiene.test.ts — the CSS comment-termination guard (2026-11-12).
 *
 * During the fidelity pass the fold's base `.btn-primary` rule silently
 * vanished from the production build while every neighbouring rule
 * compiled. Root cause: a comment in tokens.css/reference.css spelled out
 * the reference's "ix" / "ln" / "hdoc" selectors as `ix` + star + slash +
 * `ln` + star + slash — a bare star-slash INSIDE a CSS comment TERMINATES
 * that comment early, and lightningcss (Next's production CSS optimizer)
 * then parses the trailing comment text as CSS, recovers from the
 * resulting parse error, and drops the next real rule. The two "Unexpected
 * token Delim('*')" warnings in the build log are the footprint; a missing
 * rule in the built sheet is the damage.
 *
 * No CSS parser can distinguish an accidental early star-slash from an
 * intended one (both are legal comment closers), so this gate pins the
 * PROJECT'S OWN convention instead: a comment terminator in this codebase
 * is always preceded by whitespace, "(" or "*". Anything else — the
 * selector-shorthand pattern above — is the bug shape and fails the test
 * before it reaches a build. (Which is why this file's own comments spell
 * the pattern out in prose: the same two characters terminate JSDoc too.)
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const CSS_DIR = join(process.cwd(), "src/styles/globalCss");

const cssFiles = readdirSync(CSS_DIR).filter((name) => name.endsWith(".css"));

describe("CSS comments never contain a bare star-slash", () => {
  it("found the project stylesheets to check", () => {
    expect(cssFiles.length).toBeGreaterThan(0);
  });

  it("no comment is terminated early by an inline star-slash", () => {
    const violations: string[] = [];
    for (const name of cssFiles) {
      const text = readFileSync(join(CSS_DIR, name), "utf8");
      for (const [lineNo, line] of text.split("\n").entries()) {
        const lineNo1 = lineNo + 1;
        for (const match of line.matchAll(/\*\//g)) {
          const before = match.index === 0 ? "" : line[match.index - 1];
          // A legal terminator in this codebase follows whitespace, "(" or "*".
          if (!/[\s(*]/.test(before ?? "")) {
            violations.push(
              `${name}:${lineNo1}: suspicious star-slash after ${JSON.stringify(before)} — "${line.trim().slice(0, 60)}"`,
            );
          }
        }
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });
});
