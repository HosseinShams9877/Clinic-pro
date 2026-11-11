/**
 * overflow-probe.mjs — real 320 px overflow measurement over CDP (P1-15 gate).
 *
 * Drives the system's Edge in headless remote-debugging mode through the
 * Chrome DevTools Protocol using ONLY Node's built-in WebSocket and fetch —
 * no new dependencies. For every built route it emulates a 320×800 CSS
 * viewport, navigates, waits for the load event, and measures the document's
 * scrollWidth against the layout viewport. Any scrollWidth > 320 is a real
 * horizontal-overflow failure at the smallest target width.
 *
 * Two Edge-headless quirks discovered while building this (documented so the
 * probe is not "fixed" back into a false pass):
 *   1. A Runtime.evaluate result is nested TWO levels: response.result.result.value.
 *   2. Emulation.setDeviceMetricsOverride with mobile:true does NOT pin innerWidth
 *      in this Edge (innerWidth stays at the default 1280 while screen.width moves).
 *      With mobile:false the 320 px layout viewport holds and survives navigation
 *      and reload. The probe verifies innerWidth === WIDTH on every route and
 *      reports the route as INVALID (not pass) when the emulation did not hold.
 *
 * Usage: node scripts/overflow-probe.mjs <http://origin> [width]
 */
const ORIGIN = process.argv[2] ?? "http://localhost:3137";
const WIDTH = Number(process.argv[3] ?? 320);
const HEIGHT = 800;

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

// The release gate is "no horizontal overflow at 320px (en + fa)" — i.e. both
// directions, LTR and RTL. Persian is the default (no query); the two sibling
// locales are appended so every route is measured three times, once per
// direction mix. `?lang=` is mirrored to the locale cookie by middleware, so
// the whole render flips, not just a class.
const MEASURED_URLS = [
  ...ROUTES,
  ...ROUTES.map((route) => `${route}?lang=en`),
  ...ROUTES.map((route) => `${route}?lang=ar`),
];

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
    setTimeout(() => reject(new Error(`timeout: ${method}`)), 30_000);
  });
}

await send("Page.enable");
await send("Runtime.enable");

const MEASURE = `(() => {
  const de = document.documentElement;
  const overflowing = [];
  for (const element of de.querySelectorAll("body *")) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.right > ${WIDTH} + 0.5) {
      const chain = [];
      let node = element.parentElement;
      while (node && chain.length < 4) {
        const r = node.getBoundingClientRect();
        chain.push({
          tag: node.tagName,
          cls: (typeof node.className === "string" ? node.className : "").slice(0, 70),
          w: Math.round(r.width),
        });
        node = node.parentElement;
      }
      overflowing.push({
        tag: element.tagName,
        cls: (typeof element.className === "string" ? element.className : "").slice(0, 90),
        right: Math.round(rect.right),
        chain,
      });
    }
  }
  return JSON.stringify({
    url: location.pathname,
    innerWidth: window.innerWidth,
    scrollWidth: de.scrollWidth,
    overflowing,
  });
})()`;

const results = [];
for (const route of MEASURED_URLS) {
  // Re-apply per route: the override survives navigation/reload but is cheap to renew.
  await send("Emulation.setDeviceMetricsOverride", {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url: `${ORIGIN}${route}` });
  await sleep(1200); // let the load event and any hydration settle

  const measurement = await send("Runtime.evaluate", {
    expression: MEASURE,
    returnByValue: true,
  });
  // CDP wraps the evaluate result two levels deep. If value is missing the
  // measurement is INVALID — never silently counted as a pass.
  const raw = measurement.result?.result?.value;
  if (typeof raw !== "string") {
    console.log(`INVALID  ${route}  (evaluate returned no value: ${JSON.stringify(measurement).slice(0, 200)})`);
    results.push({ route, valid: false });
    continue;
  }
  const parsed = JSON.parse(raw);
  const viewportHeld = parsed.innerWidth === WIDTH;
  const overflowing = parsed.scrollWidth > WIDTH;
  const status = !viewportHeld ? "INVALID" : overflowing ? "FAIL" : "ok  ";
  console.log(
    `${status}  ${route}  innerWidth=${parsed.innerWidth} scrollWidth=${parsed.scrollWidth}` +
      (parsed.overflowing.length ? `  offenders=${parsed.overflowing.length}` : ""),
  );
  for (const offender of parsed.overflowing.slice(0, 6)) {
    console.log(`        → <${offender.tag} class="${offender.cls}"> right=${offender.right}`);
    for (const ancestor of offender.chain) {
      console.log(`            ↑ <${ancestor.tag} class="${ancestor.cls}"> w=${ancestor.w}`);
    }
  }
  results.push({ route, valid: viewportHeld, scrollWidth: parsed.scrollWidth, overflowing });
}

const measured = results.filter((row) => row.valid !== undefined);
const valid = measured.filter((row) => row.valid);
const failures = valid.filter((row) => row.overflowing);
const invalid = results.filter((row) => row.valid === undefined || !row.valid);
console.log(
  `\n${failures.length === 0 && invalid.length === 0 ? "PASS" : "FAIL"}: ` +
    `${valid.length - failures.length}/${valid.length} measured routes have no horizontal overflow at ${WIDTH}px` +
    (invalid.length ? `; ${invalid.length} routes INVALID (viewport or measurement did not hold)` : ""),
);
ws.close();
process.exit(failures.length === 0 && invalid.length === 0 ? 0 : 1);
