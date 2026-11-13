/**
 * console-check.mjs — browser-side health gate over CDP (P1-15 / Part E).
 *
 * Loads every built route in the system Edge (headless, remote debugging) and
 * collects, via the Chrome DevTools Protocol with ONLY Node's built-in
 * WebSocket and fetch:
 *   - Runtime.consoleAPICalled with type error / warning
 *   - Runtime.exceptionThrown
 *   - Log.entryAdded with level error
 *   - Network.responseReceived whose status >= 400
 *   - Network.loadingFailed (asset or document that did not load at all)
 * A route is clean only when it produces zero of the above after its load event.
 * This is also the executable proof that the CSP header (next.config.ts
 * `headers()`) does not break any page: a blocked subresource surfaces here as
 * either a loadingFailed or a console error.
 *
 * The same Edge-headless quirk as overflow-probe.mjs applies: a Runtime
 * evaluation result is nested two levels (response.result.result.value) and the
 * emulation override must be re-applied per route. `mobile: false` is used
 * because with `mobile: true` innerWidth does not hold in this Edge build.
 *
 * Usage: node scripts/console-check.mjs <http://origin> [width]
 */
const ORIGIN = process.argv[2] ?? "http://localhost:3137";
const WIDTH = Number(process.argv[3] ?? 1280);
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
const events = [];
ws.onmessage = (event) => {
  const message = JSON.parse(String(event.data));
  if (message.id !== undefined && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
    return;
  }
  if (message.method) events.push(message);
};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = (nextId += 1);
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => reject(new Error(`timeout: ${method}`)), 30_000);
  });
}

const TYPE_MAP = new Map();

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await send("Network.enable");

const results = [];
for (const route of ROUTES) {
  // Fresh window for this route: clear the buffer and re-apply the viewport.
  events.length = 0;
  await send("Emulation.setDeviceMetricsOverride", {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url: `${ORIGIN}${route}` });
  await sleep(1500); // load event + hydration settle window

  const url = (entry) => (entry?.url ?? entry?.requestId ?? "").toString();
  const problems = [];
  for (const event of events) {
    const { method, params } = event;
    if (method === "Runtime.exceptionThrown") {
      problems.push({ kind: "exception", detail: params.exceptionDetails.text + " " + (params.exceptionDetails.exception?.description ?? "").slice(0, 200) });
    } else if (method === "Runtime.consoleAPICalled" && (params.type === "error" || params.type === "warning")) {
      problems.push({ kind: `console.${params.type}`, detail: params.args.map((arg) => arg.value ?? arg.description ?? "").join(" ").slice(0, 200) });
    } else if (method === "Log.entryAdded" && params.entry.level === "error") {
      // Document-level aborts during re-navigation are normal (the previous
      // route's subresources are cancelled when the next navigation lands)
      // and surface here as "Failed to load resource: net::ERR_ABORTED" —
      // only real failures count. CSP blocks surface as
      // net::ERR_BLOCKED_BY_CLIENT and must NOT be suppressed.
      const text = `${params.entry.text} ${url(params.entry)}`;
      if (!/net::ERR_ABORTED/.test(text)) {
        problems.push({ kind: "log.error", detail: text.slice(0, 200) });
      }
    } else if (method === "Network.responseReceived" && params.response.status >= 400) {
      problems.push({ kind: `http ${params.response.status}`, detail: params.response.url });
    } else if (method === "Network.loadingFailed") {
      const requestId = params.requestId;
      const type = TYPE_MAP.get(requestId) ?? "resource";
      // Document-level aborts during re-navigation are normal; only real failures count.
      if (params.blockedReason || params.errorText !== "net::ERR_ABORTED") {
        problems.push({ kind: `loadFailed${params.blockedReason ? `:${params.blockedReason}` : ""}`, detail: `${type} ${params.errorText}`.trim() });
      }
    } else if (method === "Network.requestWillBeSent") {
      TYPE_MAP.set(params.requestId, params.type);
    }
  }
  // Deduplicate by kind+detail (hydrating pages repeat console output).
  const uniq = [...new Map(problems.map((problem) => [`${problem.kind}|${problem.detail}`, problem])).values()];
  results.push({ route, problems: uniq });
  console.log(`${uniq.length === 0 ? "clean" : "PROBLEMS"}  ${route}  count=${uniq.length}`);
  for (const problem of uniq) console.log(`        → ${problem.kind}: ${problem.detail}`);
}

const total = results.reduce((sum, row) => sum + row.problems.length, 0);
console.log(`\n${total === 0 ? "PASS" : "FAIL"}: ${results.filter((row) => row.problems.length === 0).length}/${results.length} routes with zero console errors, zero exceptions, zero failed or 4xx/5xx asset loads`);
ws.close();
process.exit(total === 0 ? 0 : 1);
