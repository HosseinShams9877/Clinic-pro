/**
 * a11y-scan.mjs — automated accessibility scan over CDP (Part A Decision B / R-6).
 *
 * The last unmeasured Phase 1 release gate (SEO_ACCESSIBILITY_SECURITY.md §8.2:
 * "axe: zero serious findings, both themes, both directions") is measured here.
 * The scanner is axe-core 4.14.0, added as a DEV dependency only — it is never
 * imported by the app, never served by the built site, and never bundled. It is
 * injected into the page through CDP (`Page.addScriptToEvaluateOnNewDocument`
 * with the library source), so the scan runs against the real built pages with
 * no change to `src/` or `public/`.
 *
 * Coverage: every built route (12) × locale (fa RTL, en LTR, ar RTL) × color
 * theme (light, dark via emulated `prefers-color-scheme` — the theme the site
 * ships, `themes.css`'s `@media (prefers-color-scheme: dark)` block).
 *
 * Gate: zero violations with impact serious or critical. Minor/moderate
 * findings are reported (with element selectors) but do not fail the gate;
 * they feed Phase 2 item 6 / item 10 follow-ups. The `best-practice` tag is
 * included (P2 item 10) so the structural rules axe enforces only as best
 * practice — `heading-order` above all — are checked too; those land in the
 * moderate/minor buckets, which are reported but do not fail the gate.
 *
 * Same Edge-headless quirks as the other probes: Runtime.evaluate results are
 * nested two levels, and `Emulation.setEmulatedMedia` must be re-applied per
 * theme pass (it survives navigation but is cheap to renew).
 *
 * Usage: node scripts/a11y-scan.mjs [origin]
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const CDP_PORT = process.env.CDP_PORT ?? "9334";

const ORIGIN = process.argv[2] ?? "http://localhost:3137";
const __dirname = dirname(fileURLToPath(import.meta.url));
const AXE_PATH = join(__dirname, "..", "node_modules", "axe-core", "axe.min.js");
const AXE_SOURCE = readFileSync(AXE_PATH, "utf8");

const ROUTES = [
  "/",
  "/services",
  "/services/gen",
  "/services/plastic",
  "/services/ortho",
  "/services/uro",
  "/services/eye",
  "/services/ent",
  "/services/gyn",
  "/services/aes",
  "/services/anes",
  "/services/endo",
  // P2 item 4's 404 page — in the round-2 audit (item 10) too.
  "/nonexistent-page",
];

const LOCALES = ["fa", "en", "ar"];
const THEMES = ["light", "dark"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function findTarget() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json`)).json();
      const page = list.find((target) => target.type === "page");
      if (page) return page;
    } catch {
      // Edge not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`no CDP page target at 127.0.0.1:${CDP_PORT}`);
}

const target = await findTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let nextId = 0;
const pending = new Map();
ws.onmessage = (event) => {
  const message = JSON.parse(String(event.data));
  if (message.id !== undefined && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = (nextId += 1);
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => reject(new Error(`timeout: ${method}`)), 60_000);
  });
}

await send("Page.enable");
await send("Runtime.enable");

// Inject axe once; it is re-evaluated on every new document (each navigation).
await send("Page.addScriptToEvaluateOnNewDocument", { source: AXE_SOURCE });

const RUN_OPTIONS = {
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] },
  resultTypes: ["violations"],
  rules: { "color-contrast": { enabled: true } },
};

const RUN = `axe
  .run(document, ${JSON.stringify(RUN_OPTIONS)})
  .then((results) =>
    JSON.stringify(
      results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        tags: violation.tags.filter((tag) => tag.startsWith("wcag")),
        count: violation.nodes.length,
        selectors: violation.nodes.slice(0, 4).map((node) => node.target.join(" ")),
      })),
    ),
  )`;

const totals = { serious: 0, critical: 0, minor: 0, moderate: 0 };
const fileRows = [];
const findings = [];

for (const theme of THEMES) {
  for (const locale of LOCALES) {
    for (const route of ROUTES) {
      await send("Emulation.setEmulatedMedia", {
        features: [{ name: "prefers-color-scheme", value: theme === "dark" ? "dark" : "light" }],
      });
      // Always pass ?lang= explicitly: middleware mirrors it into the `lang`
      // cookie, which otherwise persists from the previous page-run and would
      // render (and label) this run with the wrong locale.
      await send("Page.navigate", { url: `${ORIGIN}${route}?lang=${locale}` });
      await new Promise((resolve) => setTimeout(resolve, 1100)); // load + hydration settle

      const langCheck = await send("Runtime.evaluate", {
        expression: `JSON.stringify({lang: document.documentElement.lang, dir: document.documentElement.dir})`,
        returnByValue: true,
      });
      const lang = langCheck.result?.result?.value ?? "{}";

      let raw;
      try {
        const response = await send("Runtime.evaluate", {
          expression: RUN,
          returnByValue: true,
          awaitPromise: true,
        });
        raw = response.result?.result?.value;
      } catch (error) {
        raw = null;
        console.log(`INVALID  [${theme}/${locale}]${route}  (axe.run rejected: ${error.message})`);
      }
      if (typeof raw !== "string") {
        console.log(`INVALID  [${theme}/${locale}]${route}  (no value; ${String(raw).slice(0, 160)})`);
        fileRows.push({ theme, locale, route, status: "INVALID" });
        continue;
      }
      const violations = JSON.parse(raw);
      const bucket = { serious: [], critical: [], minor: [], moderate: [] };
      for (const violation of violations) {
        if (bucket[violation.impact]) bucket[violation.impact].push(violation);
      }
      const hard = bucket.serious.length + bucket.critical.length;
      for (const impact of ["serious", "critical", "moderate", "minor"]) {
        totals[impact] += bucket[impact].length;
      }
      const status = hard === 0 ? "ok  " : "FAIL";
      const soft = bucket.moderate.length + bucket.minor.length;
      console.log(
        `${status}  [${theme}/${locale}]${route}  html=${lang}  serious=${bucket.serious.length} critical=${bucket.critical.length} moderate=${bucket.moderate.length} minor=${bucket.minor.length}`,
      );
      for (const impact of ["critical", "serious", "moderate", "minor"]) {
        for (const violation of bucket[impact]) {
          console.log(`        → ${impact}/${violation.id} (${violation.help}) ×${violation.count}  ${violation.tags.join(" ")}`);
          for (const selector of violation.selectors) {
            console.log(`            · ${selector}`);
            findings.push({ theme, locale, route, impact, id: violation.id, help: violation.help, selector, wcag: violation.tags });
          }
        }
      }
      fileRows.push({ theme, locale, route, status, soft });
    }
  }
}

const invalid = fileRows.filter((row) => row.status === "INVALID");
const hard = totals.serious + totals.critical;
console.log(
  `\n${hard === 0 && invalid.length === 0 ? "PASS" : "FAIL"}: axe scan over ${fileRows.length} page-runs ` +
    `(${ROUTES.length} routes × ${LOCALES.length} locales × ${THEMES.length} themes) — ` +
    `serious=${totals.serious} critical=${totals.critical} moderate=${totals.moderate} minor=${totals.minor}` +
    (invalid.length ? `; ${invalid.length} INVALID page-runs` : ""),
);
ws.close();
process.exit(hard === 0 && invalid.length === 0 ? 0 : 1);
