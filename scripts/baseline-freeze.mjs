#!/usr/bin/env node
/**
 * baseline-freeze.mjs — the Phase 2 item-14 baseline tool.
 *
 * The Phase 2 regression suite (28 files / 218 tests at freeze) is the Phase 3
 * baseline: "future phases must not break parity" (PHASE_2.md, item 14). With
 * no git history in this repository, the manifest written by this tool IS the
 * audit trail — so the freeze is enforced by a test, not by convention:
 *
 *   `tests/phase2-baseline.test.ts` fails when any frozen file is missing or
 *   no longer byte-identical. Editing or removing a baseline test file is
 *   therefore never silent: the author must refreeze (`--write`) and amend
 *   `docs/reports/PHASE_2_BASELINE.md` with the reason.
 *
 * Usage:
 *   node scripts/baseline-freeze.mjs              # verify (default): exit 0 = intact
 *   node scripts/baseline-freeze.mjs --write      # refreeze: re-run the suite and rewrite the manifest
 *   node scripts/baseline-freeze.mjs --write --json tmp-baseline.json   # reuse a vitest JSON run
 *
 * Zero dependencies: node:crypto, node:fs, node:path, node:url, node:child_process only.
 * The vitest include patterns are mirrored from vitest.config.ts by hand; if
 * that config changes, update DISCOVER_ROOTS here and re-verify.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The project root. Under plain `node scripts/baseline-freeze.mjs` the module
 * URL is a real file: URL; under a bundler-driven test environment (vitest)
 * import.meta.url is not, so fall back to the cwd vitest runs from (the
 * package root). Both paths land on the same directory when invoked as
 * documented.
 */
function resolveRoot() {
  try {
    return fileURLToPath(new URL("..", import.meta.url));
  } catch {
    return process.cwd();
  }
}
const root = resolveRoot();

export const MANIFEST_REL = "tests/phase2-baseline.manifest.json";
/** The gate must never lock itself or its own manifest — that would be a
 *  self-referential trap that blocks every refreeze. */
export const SELF_EXCLUDED = ["tests/phase2-baseline.test.ts", MANIFEST_REL];

const PRUNE = new Set(["node_modules", ".next", ".git", "پلتفرم", "dist", "out"]);
const TEST_FILE = /\.test\.(ts|tsx)$/;

/** Repo-relative (POSIX) paths of every test file the vitest config picks up. */
export function discoverTestFiles(from = root) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (PRUNE.has(entry)) continue;
      const abs = join(dir, entry);
      const st = statSync(abs);
      if (st.isDirectory()) walk(abs);
      else if (TEST_FILE.test(abs)) out.push(relative(from, abs).split(sep).join("/"));
    }
  };
  walk(from);
  out.sort();
  return out.filter((rel) => !SELF_EXCLUDED.includes(rel));
}

export function sha256File(rel, from = root) {
  const buf = readFileSync(join(from, rel));
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * The verification the gate test runs: every frozen file present and
 * byte-identical. `added` is informational only — Phase 3 is expected to ADD
 * tests, and additions are never a baseline violation.
 */
export function verifyBaseline(from = root) {
  const manifestPath = join(from, MANIFEST_REL);
  if (!existsSync(manifestPath)) {
    return { ok: false, error: `manifest missing: ${MANIFEST_REL}`, missing: [], changed: [], added: [] };
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const frozen = /** @type {Record<string, {sha256: string, tests: number}>} */ (manifest.files ?? {});
  const onDisk = new Set(discoverTestFiles(from));
  const missing = [];
  const changed = [];
  for (const rel of Object.keys(frozen).sort()) {
    if (!onDisk.has(rel)) missing.push(rel);
    else if (sha256File(rel, from) !== frozen[rel].sha256) changed.push(rel);
  }
  const added = [...onDisk].filter((rel) => !(rel in frozen));
  return { ok: missing.length === 0 && changed.length === 0, missing, changed, added, manifest };
}

/** Per-file vitest test counts from a `vitest run --reporter=json` output. */
function countsFromVitestJson(jsonPath, from = root) {
  const json = JSON.parse(readFileSync(jsonPath, "utf8"));
  const files = {};
  for (const result of json.testResults ?? []) {
    const rel = relative(from, result.name).split(sep).join("/");
    const tests = (result.assertionResults ?? []).length;
    files[rel] = { tests };
  }
  return { files, total: json.numTotalTests ?? 0 };
}

function runSuiteForCounts(from = root) {
  const outFile = join(from, "tmp-baseline.json");
  const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const res = spawnSync(cmd, ["vitest", "run", "--reporter=json", `--outputFile=${outFile}`], {
    cwd: from,
    stdio: "inherit",
    shell: false,
  });
  if (res.status !== 0) throw new Error(`vitest run failed (exit ${res.status}) — baseline frozen only from a green suite`);
  return countsFromVitestJson(outFile, from);
}

function localIsoDate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function writeManifest(from = root, jsonPath) {
  const counts = jsonPath ? countsFromVitestJson(jsonPath, from) : runSuiteForCounts(from);
  const files = {};
  let total = 0;
  for (const rel of discoverTestFiles(from)) {
    const entry = counts.files[rel] ?? { tests: 0 };
    files[rel] = { sha256: sha256File(rel, from), tests: entry.tests };
    total += entry.tests;
  }
  const manifest = {
    version: 1,
    frozenAs: "Phase 3 regression baseline (Phase 2 item 14)",
    frozenAt: localIsoDate(),
    suite: { files: Object.keys(files).length, tests: total },
    environment: {
      node: process.version,
      vitest: installedVersion("vitest"),
      next: installedVersion("next"),
      react: installedVersion("react"),
      typescript: installedVersion("typescript"),
    },
    gate: [
      "Every file in `files` must exist on disk with the SAME sha256 (enforced by",
      "tests/phase2-baseline.test.ts). Removing or editing a baseline test file fails",
      "the suite. Adding new test files is allowed and NOT a violation — the manifest",
      "lists the frozen set, not a cap. To change a frozen file: run",
      "`node scripts/baseline-freeze.mjs --write` and record the reason in",
      "docs/reports/PHASE_2_BASELINE.md.",
    ].join(" "),
    files,
  };
  writeFileSync(join(from, MANIFEST_REL), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

function installedVersion(name) {
  try {
    return JSON.parse(readFileSync(join(root, "node_modules", name, "package.json"), "utf8")).version;
  } catch {
    return "unknown";
  }
}

// --- CLI ---------------------------------------------------------------------
// Guarded: tests import verifyBaseline from this module, so the CLI must only
// run when invoked directly (`node scripts/baseline-freeze.mjs …`).
import { pathToFileURL } from "node:url";
const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isMain) {
  const args = new Set(process.argv.slice(2));
  if (args.has("--write")) {
    const jsonArg = process.argv[process.argv.indexOf("--json") + 1];
    const m = writeManifest(root, jsonArg);
    console.log(`frozen: ${m.suite.files} files / ${m.suite.tests} tests → ${MANIFEST_REL}`);
    console.log("amend docs/reports/PHASE_2_BASELINE.md with the reason for this refreeze.");
  } else {
    const report = verifyBaseline(root);
    if (report.error) {
      console.error(`baseline: ${report.error}`);
      process.exit(1);
    }
    if (report.missing.length) console.error(`baseline: MISSING frozen files:\n  ${report.missing.join("\n  ")}`);
    if (report.changed.length) console.error(`baseline: CHANGED frozen files:\n  ${report.changed.join("\n  ")}`);
    if (report.added.length) console.log(`baseline: ${report.added.length} new file(s) since freeze (additions are allowed):\n  ${report.added.join("\n  ")}`);
    const ok = report.ok;
    console.log(ok ? "baseline: intact (all frozen files present and byte-identical)" : "baseline: DRIFT — refreeze with --write and document why, or restore the frozen files");
    process.exit(ok ? 0 : 1);
  }
}
