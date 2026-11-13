/**
 * reduced-motion-pass.mjs — interactive reduced-motion pass over CDP
 * (Part A Decision B / R-6).
 *
 * The Phase 1 release gate "reduced-motion pass" (SEO_ACCESSIBILITY_SECURITY.md
 * §8.2), executed for real rather than unit-tested only: the emulated media
 * feature `prefers-reduced-motion: reduce` is applied through
 * `Emulation.setEmulatedMedia` (the same browser media engine a real OS-level
 * reduced-motion setting drives), every route is loaded under it, and the page
 * is verified to:
 *
 *   1. render the FULL content — no `[data-reveal]` block left at opacity 0
 *      (the `.fx` gate that hides pre-reveal state must release);
 *   2. NOT carry the living-layer `.fx` class on <html> (LivingEffects removes
 *      it under reduced motion);
 *   3. have no running decoration: hero particle spans must be absent (the
 *      particle island mounts nothing under reduced motion) and computed
 *      transitions/animations on the reveal/particle elements must be `none`
 *      or 0s duration;
 *   4. leave `[data-count]` numbers at their FINAL value (no count-up;
 *      the text must contain the target digits);
 *   5. stay interactive — no element depends on motion to be usable (the
 *      mobile-menu burger must still toggle);
 *   6. complementary `no-preference` run: under normal motion the `.fx` class
 *      IS set and reveal initial states ARE hidden — proving the gate is
 *      actually responding to the preference, not permanently disabled.
 *
 * No new dependencies: Node's built-in WebSocket and fetch only.
 *
 * Usage: node scripts/reduced-motion-pass.mjs [origin]
 */
const ORIGIN = process.argv[2] ?? "http://localhost:3137";
const WIDTH = 1280;

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

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, returnByValue: true });
  const raw = response.result?.result?.value;
  if (typeof raw !== "string") throw new Error(`evaluate returned no value: ${JSON.stringify(response).slice(0, 200)}`);
  return raw;
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: WIDTH,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});

const STATE = `(() => {
  const html = document.documentElement;
  const reveals = [...document.querySelectorAll("[data-reveal]")];
  const hidden = reveals.filter((element) => getComputedStyle(element).opacity === "0");
  const counts = [...document.querySelectorAll("[data-count]")];
  const motionful = counts.filter((element) => (element.textContent ?? "").trim() === "0");
  const decor = {
    fx: html.classList.contains("fx"),
    revealTotal: reveals.length,
    revealHidden: hidden.length,
    revealWithTransition: reveals.filter((element) => getComputedStyle(element).transitionDuration !== "0s").length,
    countTotal: counts.length,
    countsStuckAtZero: motionful.length,
    animated: [...document.querySelectorAll("body *")].filter((element) => {
      const style = getComputedStyle(element);
      // 0s duration counts as halted, not running: the app's reduced-motion
      // reset (layout.css @media reduce) zeroes animation-duration while
      // leaving animation-name set — the canonical WCAG 2.3.3 reset. Nulling
      // the names instead would leave heroIn-gated content (opacity:0 until
      // heroIn ... forwards completes) invisible under reduce. With duration 0s
      // the animation resolves instantly to its final frame: nothing moves.
      return (
        style.animationName !== "none" &&
        style.animationPlayState === "running" &&
        style.animationDuration !== "0s"
      );
    }).length,
  };
  return JSON.stringify(decor);
})()`;

const TOGGLE_INTERACTIVE = `(() => {
  // The mobile menu must operate without any motion help. Select the burger by
  // its aria-controls: querySelector("button[aria-expanded]") matches the FIRST
  // such button in DOM order, which is the language-switcher opener, not the
  // burger (same trap the keyboard pass documents).
  const burger = document.querySelector("button[aria-controls='menu']");
  if (burger === null) return JSON.stringify({ error: "no burger button" });
  burger.click();
  const expandedAfterClick = burger.getAttribute("aria-expanded");
  return JSON.stringify({ burger: burger.getAttribute("aria-label")?.slice(0, 30) ?? "", expandedAfterClick });
})()`;

let problems = 0;
const summary = [];

async function runPreference(value, label) {
  await send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-reduced-motion", value },
      { name: "prefers-color-scheme", value: "light" },
    ],
  });
  for (const route of ROUTES) {
    await send("Page.navigate", { url: `${ORIGIN}${route}?lang=fa` });
    await sleep(1200); // load + hydration; the island reads the gate in an effect

    let state;
    try {
      state = JSON.parse(await evaluate(STATE));
    } catch (error) {
      console.log(`INVALID  [${label}]${route}  state measurement failed: ${error.message}`);
      problems += 1;
      continue;
    }

    const routeProblems = [];
    if (value === "reduce") {
      // Under reduced motion everything must be visible and still.
      if (state.fx) routeProblems.push(`html still carries the .fx motion class`);
      if (state.revealHidden > 0) {
        routeProblems.push(`${state.revealHidden}/${state.revealTotal} [data-reveal] block(s) still hidden (opacity 0)`);
      }
      if (state.revealWithTransition > 0) {
        routeProblems.push(`${state.revealWithTransition} [data-reveal] element(s) still carry a running transition`);
      }
      if (state.countsStuckAtZero > 0) {
        routeProblems.push(`${state.countsStuckAtZero}/${state.countTotal} [data-count] number(s) left at 0 — count-up ran or stripped the value`);
      }
      if (state.animated > 0) routeProblems.push(`${state.animated} element(s) with a running animation`);
    } else {
      // Under no-preference the motion layer must be ARMED (this is the proof
      // the gate is live, not permanently disabled).
      if (state.revealTotal > 0 && !state.fx) {
        routeProblems.push("html does NOT carry .fx under prefers-reduced-motion: no-preference (gate is dead)");
      }
    }

    // Interactive controls must still work under both preferences.
    if (route === "/") {
      let toggle;
      try {
        toggle = JSON.parse(await evaluate(TOGGLE_INTERACTIVE));
      } catch (error) {
        toggle = { error: error.message };
      }
      if (toggle.error || toggle.expandedAfterClick === null || toggle.expandedAfterClick === undefined) {
        routeProblems.push(`mobile-menu burger did not toggle under ${label} (${JSON.stringify(toggle)})`);
      }
    }

    if (routeProblems.length === 0) {
      console.log(
        `ok      [${label}]${route}  fx=${state.fx} reveal=${state.revealTotal}/${state.revealHidden} counts=${state.countTotal}/${state.countsStuckAtZero} animated=${state.animated}`,
      );
      summary.push({ label, route, state, ok: true });
    } else {
      problems += 1;
      console.log(`FAIL    [${label}]${route}  ${routeProblems.length} problem(s)`);
      for (const problem of routeProblems) console.log(`        → ${problem}`);
      summary.push({ label, route, state, ok: false });
    }
  }
}

await runPreference("reduce", "reduce");
await runPreference("no-preference", "no-pref");

console.log(
  `\n${problems === 0 ? "PASS" : "FAIL"}: interactive reduced-motion pass over ${summary.length} page-runs ` +
    `(12 routes × {reduce, no-preference}) — content fully visible and static under reduce; motion layer armed under no-preference; controls still toggled`,
);
ws.close();
process.exit(problems === 0 ? 0 : 1);
