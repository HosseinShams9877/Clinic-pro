/**
 * cwv-audit.mjs — Core Web Vitals audit against the budget (P2 item 11).
 *
 * Measures ttfb / fcp / lcp / cls / inp on the live production build via CDP
 * (Edge headless, same zero-dependency harness family as a11y-scan.mjs) and
 * exits non-zero on any breach of `./cwv-budget.mjs`. Wire-up: `npm run cwv`
 * and `.github/workflows/cwv-budget.yml`.
 *
 * Measurement design, and what is recorded vs gated:
 *
 * - Origin: `http://localhost:3137` by default (first CLI arg / CWV_ORIGIN
 *   env override), i.e. **local HTTP**. HTTPS/HSTS is deferred to risk R-4 by
 *   owner decision; the deferral is re-stated in the item-11 notes. The same
 *   budgets apply on a real origin — only TTFB gains a TLS handshake there.
 * - Routes: the three representative in-surface pages plus the item-4 404 —
 *   `/`, `/services`, one SSG category page (`/services/gen`), the 404.
 * - Widths: 393 px (the spec's 320 px floor is covered by the no-overflow
 *   gate; 393 is the reference's own mobile width) and 1280 px.
 * - Locale: `?lang=fa` always — the canonical locale, and the one that
 *   exercises RTL rendering. (Cookie precedence: see a11y-scan.mjs.)
 * - **Cold vs warm.** The item-8 finding stands: `next/image` AVIF is
 *   generated on demand, so a *cold* first load pays a one-time per-width
 *   encode and the warm numbers are the headline. The gate therefore runs on
 *   WARM loads; cold is measured and reported alongside, with cache disabled,
 *   so the cold regressions are still visible in the log.
 * - **INP via real input.** `Input.dispatchMouseEvent` drives genuine clicks
 *   (move → down → up) on real targets rather than synthesising events in JS:
 *   the language-switcher button at 1280 px (a desktop-visible state toggle)
 *   and the mobile-menu burger at 393 px (`md:hidden`), three clicks each.
 *   The metric is measured with capture-phase document listeners (pointerdown
 *   → first frame after the click handlers) because this Edge build's Event
 *   Timing API does not reliably emit entries for synthesised input — a
 *   documented proxy, not a field p98.
 * - Metrics come from `PerformanceObserver` entries accumulated by an
 *   injected script (`Page.addScriptToEvaluateOnNewDocument`), so nothing in
 *   `src/` or `public/` changes to measure it.
 *
 * Usage: node scripts/cwv-audit.mjs [origin]
 */
import {
  BUDGET,
  METRICS,
  evaluateRoute,
  formatMetric,
  sessionWindowCLS,
} from "./cwv-budget.mjs";

const CDP_PORT = process.env.CDP_PORT ?? "9334";
const ORIGIN = process.env.CWV_ORIGIN ?? process.argv[2] ?? "http://localhost:3137";
const ROUTES = ["/", "/services", "/services/gen", "/nonexistent-page"];
const WIDTHS = [393, 1280];
const SETTLE_MS = 3000; // paint + hydration + late layout settle per load

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
    await sleep(250);
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
    setTimeout(() => reject(new Error(`timeout: ${method}`)), 90_000);
  });
}

const ev = async (expression) => {
  const response = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (response.result?.exceptionDetails) {
    throw new Error(JSON.stringify(response.result.exceptionDetails));
  }
  return response.result?.result?.value;
};

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");

// Collector: accumulates paint/layout-shift entries into window.__cwv, plus
// the interaction marker described below. Reset per navigation by re-running
// as a new-document script.
//
// INP measurement note (read before changing the click path): Chrome's Event
// Timing API does NOT reliably produce `event` entries for CDP-dispatched
// input in this Edge build — over the calibration runs the observer stayed
// empty on 6 of 8 page-runs and on the other 2 produced three entries whose
// durations (264/432 ms) contradicted page-side timing of the very same
// gesture by ~5×. Gating on that would gate on noise, so the gate instead
// measures the gesture with capture-phase document listeners: t0 at
// pointerdown (the moment the input reaches the page) and t2 at the first
// animation frame after the click handlers ran (≈ the next presented frame),
// i.e. processing + presentation latency of the interaction — the same
// segments INP captures, measured from inside the page, disclosed as a proxy
// (it does not include the OS→browser input hop a real user's hardware adds).
// Event-timing entries, when the platform deigns to emit them, are still
// collected and printed as a diagnostic line.
const COLLECTOR = `
window.__cwv = window.__cwv || { shifts: [], events: [], fcp: null, lcp: null };
window.__cwv.shifts = [];
window.__cwv.events = [];
window.__cwv.fcp = null;
window.__cwv.lcp = null;
window.__cwv.gestures = [];
new PerformanceObserver((list) => {
  for (const e of list.getEntries()) {
    if (!e.hadRecentInput) window.__cwv.shifts.push({ startTime: e.startTime, value: e.value });
  }
}).observe({ type: "layout-shift", buffered: true });
new PerformanceObserver((list) => {
  for (const e of list.getEntries()) {
    if (e.name === "first-contentful-paint") window.__cwv.fcp = e.startTime;
  }
}).observe({ type: "paint", buffered: true });
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  window.__cwv.lcp = entries.length ? entries[entries.length - 1].startTime : null;
}).observe({ type: "largest-contentful-paint", buffered: true });
new PerformanceObserver((list) => {
  for (const e of list.getEntries()) {
    if (e.interactionId > 0) window.__cwv.events.push({ id: e.interactionId, duration: e.duration });
  }
}).observe({ type: "event", buffered: true });
document.addEventListener("pointerdown", () => {
  window.__cwv.gestures.push({ t0: performance.now(), t1: null, t2: null });
}, { capture: true });
document.addEventListener("click", () => {
  const g = window.__cwv.gestures[window.__cwv.gestures.length - 1];
  if (!g || g.t1 !== null) return;
  g.t1 = performance.now();
  requestAnimationFrame(() => { g.t2 = performance.now(); });
}, { capture: true });
`;
await send("Page.addScriptToEvaluateOnNewDocument", { source: COLLECTOR });

// One real click cycle at the centre of an element (move → down → up). The
// 16 ms press gap is the documented stand-in for a user's down→up time and is
// INCLUDED in the measured gesture latency, which is why it stays small and
// fixed instead of the CDP-default-ish 60 ms.
async function clickSelector(selector) {
  const box = await ev(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  if (!box) return false;
  for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) {
    await send("Input.dispatchMouseEvent", {
      type,
      x: box.x,
      y: box.y,
      button: "left",
      buttons: type === "mouseReleased" ? 0 : 1,
      clickCount: 1,
    });
    await sleep(16);
  }
  return true;
}

function readMetrics(includeInp) {
  return ev(`(() => {
    const c = window.__cwv || { shifts: [], events: [], fcp: null, lcp: null, gestures: [] };
    const nav = performance.getEntriesByType("navigation")[0];
    // INP proxy: the longest completed gesture (pointerdown → first frame
    // after click handlers). See the collector comment for why this is not
    // the Event Timing duration.
    let inp = null;
    if (${includeInp}) {
      const done = c.gestures.filter((g) => g.t2 !== null).map((g) => g.t2 - g.t0);
      inp = done.length ? Math.max(...done) : null;
    }
    return JSON.stringify({
      ttfb: nav ? nav.responseStart : null,
      fcp: c.fcp,
      lcp: c.lcp,
      cls: ${sessionWindowCLS.toString()}(c.shifts),
      inp,
      shifts: c.shifts.length,
      gestures: c.gestures.length,
      eventTiming: c.events.length,
    });
  })()`);
}

const buttonForWidth = (width) =>
  width < 640
    ? 'button[aria-controls="mobile-menu"]' // MobileMenu burger (md:hidden)
    : 'button[aria-haspopup="menu"]'; // LanguageSwitcher toggle

async function measureRoute(route, width, cold) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: width < 640 ? 850 : 900,
    deviceScaleFactor: 1,
    mobile: width < 640,
  });
  // Cold pass: cache disabled for this load, so it really pays the per-width
  // AVIF encode (see the header). The warm load of the same URL then measures
  // the cached path the gate cares about.
  await send("Network.setCacheDisabled", { cacheDisabled: cold });
  await send("Page.navigate", { url: `${ORIGIN}${route}?lang=fa` });
  await sleep(SETTLE_MS);

  // Warm pass: three real clicks (open → close → open) on the settled page,
  // then read every metric (INP included) from the same page load. Cold
  // pass: read immediately, no interactions.
  let interactionNote = "no interaction target on this route";
  if (!cold) {
    const selector = buttonForWidth(width);
    let clicks = 0;
    for (let i = 0; i < 3; i += 1) {
      if (await clickSelector(selector)) clicks += 1;
      await sleep(250);
    }
    await sleep(400); // let the last gesture's frame land
    if (clicks > 0) interactionNote = `${clicks}× ${selector}`;
  }
  const raw = await readMetrics(!cold);
  const measured = JSON.parse(raw);
  return { ...measured, interactionNote };
}

console.log(`CWV audit — origin ${ORIGIN} (local HTTP; HSTS/HTTPS deferred to R-4)`);
console.log(`routes: ${ROUTES.join(", ")} × widths ${WIDTHS.join(", ")} px, lang=fa`);
console.log(`budget: ${METRICS.map((m) => `${m} ≤ ${formatMetric(m, BUDGET[m])}`).join(", ")}`);
console.log("cold runs are reported; the GATE runs on warm loads (see header).\n");

const rows = [];
let failures = 0;

for (const width of WIDTHS) {
  for (const route of ROUTES) {
    const cold = await measureRoute(route, width, true);
    const warm = await measureRoute(route, width, false);
    for (const [label, measured] of [["cold", cold], ["warm", warm]]) {
      const metrics = { ttfb: measured.ttfb, fcp: measured.fcp, lcp: measured.lcp, cls: measured.cls, inp: measured.inp };
      const { pass, breaches } = evaluateRoute(metrics);
      const gated = label === "warm";
      if (gated && !pass) failures += 1;
      console.log(
        `${gated ? (pass ? "PASS" : "FAIL") : "info"}  ${route} @${width}px ${label.padEnd(4)} ` +
          METRICS.map((m) => `${m}=${formatMetric(m, metrics[m])}`).join("  ") +
          (measured.gestures != null
            ? `  (${measured.gestures} gesture(s), ${measured.interactionNote}; event-timing entries: ${measured.eventTiming} — diagnostic only)`
            : ""),
      );
      for (const breach of breaches) {
        console.log(
          `       ↳ ${breach.metric} ${formatMetric(breach.metric, breach.value)} exceeds budget ${formatMetric(breach.metric, breach.budget)}` +
            (gated ? "" : "  [cold — reported, not gated]"),
        );
      }
      rows.push({ route, width, label, ...metrics, pass: gated ? pass : null });
    }
  }
}

console.log(
  `\n${failures === 0 ? "PASS" : "FAIL"}: CWV budget over ${rows.filter((r) => r.label === "warm").length} warm page-runs` +
    (` (${failures} breaching)`),
);
console.log(
  "note: INP here is the longest of the audit's own gestures (pointerdown → first\n" +
    "frame after click handlers), measured from inside the page — a proxy for a field\n" +
    "p98, not a field p98; TTFB is measured against local HTTP (no TLS — R-4).",
);
ws.close();
process.exit(failures === 0 ? 0 : 1);
