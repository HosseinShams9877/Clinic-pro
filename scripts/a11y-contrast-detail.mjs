/**
 * a11y-contrast-detail.mjs — companion to a11y-scan.mjs (Part A Decision B / R-6).
 *
 * a11y-scan.mjs reports WHICH selectors fail; this probe reports WHY: for every
 * color-contrast violation node it captures the computed foreground, the
 * composited background (walking the ancestor chain, compositing alpha over the
 * page canvas), and the ratio message axe computed, so the token re-tune in
 * themes.css targets exact pairs instead of guessing. For
 * label-content-name-mismatch it captures the accessible name vs. the visible
 * text.
 *
 * It prints a distinct-pair aggregate (theme / fg / bg) with hit counts and the
 * routes affected, then the per-rule detail. Like a11y-scan.mjs it runs only
 * against the built site and never touches src/ or public/.
 *
 * Usage: node scripts/a11y-contrast-detail.mjs [origin]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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
];
const LOCALES = ["fa", "en", "ar"];
const THEMES = ["light", "dark"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function findTarget() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const list = await (await fetch("http://127.0.0.1:9333/json")).json();
      const page = list.find((target) => target.type === "page");
      if (page) return page;
    } catch {
      // Edge not ready yet.
    }
    await sleep(250);
  }
  throw new Error("no CDP page target at 127.0.0.1:9333");
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
await send("Page.addScriptToEvaluateOnNewDocument", { source: AXE_SOURCE });

/**
 * Guard against the classic CDP-scripting bug: an unbalanced expression is
 * reported by the page as "SyntaxError: Unexpected token ')'" with no useful
 * position, and every page-run then looks mysteriously clean (the probe's first
 * draft returned exactly zero findings for exactly this reason). Parse the
 * expression locally before a single byte hits the wire.
 */
function precheck(expression, label) {
  try {
    new Function(expression);
  } catch (error) {
    throw new Error(`page expression for ${label} does not parse locally: ${error.message}`);
  }
}

/**
 * Resolve an axe `node.target` chain (array of selectors, outermost first) to
 * the element itself. axe's result nodes do not expose a usable DOM handle
 * through CDP serialization, so the target chain is the stable path.
 */
const PAGE_HELPERS = `
    const resolveTarget = (target) => {
      let scope = document;
      for (const selector of target) {
        if (selector === "html" || selector === "document") return document.documentElement;
        const found = scope.querySelector(selector);
        if (found === null) return null;
        scope = found;
      }
      return scope;
    };
`;

// Run axe, then - inside the page, where the DOM lives - resolve each violation
// node back to an element and read its computed style, in one round-trip per
// page. Statement bodies (not nested arrow expressions) keep the paren balance
// auditable; precheck() parses it locally before it is ever sent.
const RUN_AND_EXPLAIN = `(() => {
${PAGE_HELPERS}
  return axe
    .run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      resultTypes: ["violations"],
      rules: { "color-contrast": { enabled: true } },
    })
    .then((results) => {
      const explained = [];
      for (const violation of results.violations) {
        for (const node of violation.nodes) {
          // color-contrast carries its authoritative colors in check.data —
          // the exact pair the rule failed on, including the expected ratio.
          // Recomputing them ourselves disagrees with axe on alpha-blended
          // backgrounds, so read the data instead.
          const data = node.any.length > 0 ? node.any[0].data : undefined;
          const record = {
            rule: violation.id,
            impact: violation.impact,
            selector: node.target.join(" "),
            axeFg: data?.fgColor,
            axeBg: data?.bgColor,
            ratio: data?.contrastRatio,
            expected: data?.expectedContrastRatio,
            fontSize: data?.fontSize,
            fontWeight: data?.fontWeight,
            parentBg: data?.parentBackgroundColor,
            text: undefined,
            label: undefined,
            visible: undefined,
          };
          const element = resolveTarget(node.target);
          if (element !== null) {
            record.text = (element.textContent ?? "").trim().slice(0, 48);
            if (violation.id === "label-content-name-mismatch") {
              record.label = element.getAttribute("aria-label");
              record.visible = (element.textContent ?? "").trim().slice(0, 48);
            }
          }
          explained.push(record);
        }
      }
      return JSON.stringify(explained);
    });
})()`;

precheck(RUN_AND_EXPLAIN, "RUN_AND_EXPLAIN");

const pairAggregate = new Map();
const labelAggregate = new Map();
const allRecords = [];
let totalNodes = 0;
let pageRuns = 0;

for (const theme of THEMES) {
  for (const locale of LOCALES) {
    for (const route of ROUTES) {
      await send("Emulation.setEmulatedMedia", {
        features: [{ name: "prefers-color-scheme", value: theme === "dark" ? "dark" : "light" }],
      });
      await send("Page.navigate", { url: `${ORIGIN}${route}?lang=${locale}` });
      await sleep(1100);

      let raw;
      try {
        const response = await send("Runtime.evaluate", {
          expression: RUN_AND_EXPLAIN,
          returnByValue: true,
          awaitPromise: true,
        });
        raw = response.result?.result?.value;
      } catch (error) {
        console.log(`INVALID  [${theme}/${locale}]${route}  ${error.message}`);
        continue;
      }
      if (typeof raw !== "string") {
        console.log(`INVALID  [${theme}/${locale}]${route}  no value`);
        continue;
      }
      const records = JSON.parse(raw);
      pageRuns += 1;
      totalNodes += records.length;
      for (const record of records) {
        allRecords.push({ theme, locale, route, ...record });
        if (record.rule === "color-contrast") {
          const key = `${theme}\tfg=${record.axeFg}\tbg=${record.axeBg}\tratio=${record.ratio}/${record.expected}`;
          const entry = pairAggregate.get(key) ?? { hits: 0, routes: new Set(), sample: record };
          entry.hits += 1;
          entry.routes.add(route);
          pairAggregate.set(key, entry);
        } else if (record.label !== undefined) {
          const key = `${record.rule}  label="${record.label}"  visible="${record.visible}"`;
          const entry = labelAggregate.get(key) ?? { hits: 0, routes: new Set(), sample: record };
          entry.hits += 1;
          entry.routes.add(route);
          labelAggregate.set(key, entry);
        }
      }
    }
  }
}

console.log(`\n=== ${totalNodes} violation nodes across ${pageRuns} page-runs ===`);

// Raw node dump for exact component mapping (fed into the fix work).
writeFileSync(
  join(__dirname, "..", "docs", "reports", "a11y-contrast-nodes.json"),
  JSON.stringify(allRecords, null, 2),
);
const homeLight = allRecords.filter((r) => r.route === "/" && r.theme === "light" && r.locale === "fa");
console.log(`\n=== per-node detail: light/fa home (raw JSON in docs/reports/a11y-contrast-nodes.json) ===`);
for (const record of homeLight) {
  console.log(`  ${record.rule}  ${record.axeFg} on ${record.axeBg} (${record.ratio}/${record.expected})  "${record.text}"`);
  console.log(`      ${record.selector}`);
}
console.log(`\n=== distinct failing color pairs (theme / axe fg on axe bg), sorted by frequency ===`);
for (const [key, entry] of [...pairAggregate.entries()].sort((a, b) => b[1].hits - a[1].hits)) {
  const [theme, fg, bg, ratio] = key.split("\t");
  const sample = entry.sample;
  console.log(
    `${theme.padEnd(5)} ${fg} ${bg} ${ratio}  x${entry.hits}  (${sample.fontSize}/${sample.fontWeight}) routes:${[...entry.routes].slice(0, 5).join(",")}${entry.routes.size > 5 ? "..." : ""}`,
  );
  console.log(`        text: "${sample.text}"  parentBg=${sample.parentBg}`);
}

console.log(`\n=== distinct label-content-name-mismatch cases ===`);
for (const [key, entry] of labelAggregate.entries()) {
  console.log(`${key}  x${entry.hits}`);
  console.log(`        selector sample: ${entry.sample.selector}`);
}

ws.close();
process.exit(0);
