/**
 * phase2-baseline.test.ts — the Phase 2 item 14 freeze gate.
 *
 * The Phase 2 regression suite is the Phase 3 baseline: "future phases must
 * not break parity" (`docs/roadmap/PHASES/PHASE_2.md`, item 14). This repo has
 * no git history, so `tests/phase2-baseline.manifest.json` (written by
 * `scripts/baseline-freeze.mjs`) is the audit trail, and THIS test is what
 * makes the freeze enforceable rather than aspirational:
 *
 *   - a frozen file that is deleted, moved, or renamed → missing → fail
 *   - a frozen file whose bytes change                      → changed → fail
 *   - a brand-new test file                                 → allowed (never a failure)
 *
 * This test and its own manifest are excluded from the inventory on purpose —
 * a self-lock would make every legitimate refreeze impossible. Refreeze
 * procedure: `node scripts/baseline-freeze.mjs --write`, then record the
 * reason in `docs/reports/PHASE_2_BASELINE.md`.
 *
 * The root is `process.cwd()` (not `import.meta.url`, which vitest does not
 * expose as a file: URL inside transformed modules) — vitest and CI both run
 * from the package root, and the first test fails loudly if that ever drifts.
 */
import { describe, expect, it } from "vitest";

import { MANIFEST_REL, SELF_EXCLUDED, discoverTestFiles, verifyBaseline } from "../scripts/baseline-freeze.mjs";

const root = process.cwd();

describe("Phase 2 regression baseline (item 14 freeze)", () => {
  it("has a manifest that parses and declares a non-empty frozen suite", () => {
    const report = verifyBaseline(root);
    expect(report.error, report.error).toBeUndefined();
    const { suite } = report.manifest!;
    expect(suite.files).toBeGreaterThan(0);
    expect(suite.tests).toBeGreaterThan(0);
  });

  it("every frozen test file is present on disk and byte-identical to the freeze", () => {
    const report = verifyBaseline(root);
    expect(
      report.missing,
      `frozen baseline files are MISSING — restoring them is required; see ${MANIFEST_REL}:\n  ${report.missing.join("\n  ")}`,
    ).toEqual([]);
    expect(
      report.changed,
      `frozen baseline files CHANGED since the freeze — either restore them or refreeze ` +
        `(node scripts/baseline-freeze.mjs --write) and record why in docs/reports/PHASE_2_BASELINE.md:\n  ${report.changed.join("\n  ")}`,
    ).toEqual([]);
  });

  it("the manifest is internally consistent (file count and test total match the per-file rows)", () => {
    const { manifest } = verifyBaseline(root);
    const rows = Object.entries(manifest!.files);
    expect(rows.length, "suite.files must equal the number of per-file rows").toBe(manifest!.suite.files);
    const total = rows.reduce((sum, [, row]) => sum + row.tests, 0);
    expect(total, "suite.tests must equal the sum of per-file test counts").toBe(manifest!.suite.tests);
  });

  it("never freezes itself or its own manifest (the refreeze path must stay open)", () => {
    const inventory = discoverTestFiles(root);
    for (const excluded of SELF_EXCLUDED) {
      expect(inventory, `${excluded} must not be part of the frozen inventory`).not.toContain(excluded);
    }
  });
});
