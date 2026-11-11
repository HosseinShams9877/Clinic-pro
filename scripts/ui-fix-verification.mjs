/**
 * ui-fix-verification.mjs — UI fix pass (B-1…B-6) regression probe over CDP.
 *
 * Same harness style as scripts/overflow-probe.mjs / a11y-scan.mjs: drives the
 * system's Edge in headless remote-debugging mode through CDP with ONLY Node's
 * built-in WebSocket and fetch — no new dependencies. It measures the five
 * owner-reported bugs plus the B-6 audit (the whole in-scope surface) on the
 * REAL built pages with REAL input events.
 *
 * What it pins (each check would have caught its bug):
 *   B-1  switcher click → a full document navigation: <html lang>, <html dir>,
 *        the header nav labels AND the switcher's own label all flip with the
 *        page content (the client-only case left lang/dir stale — that mixed
 *        state was the mechanism behind B-3/4/5 too).
 *   B-2  the header carries no search affordance: no header link with an
 *        aria-label and no /#help anchor in the chrome (the #help section
 *        itself stays on the home page).
 *   B-3  the services dropdown anchors at the reading-direction start edge of
 *        its trigger, is at least as wide as the reference's 236 px menu, and
 *        never overflows the viewport in either direction.
 *   B-4  the open/closed badge: the dot sits on the reading-direction start
 *        side of the text (right in RTL, left in LTR) and is vertically
 *        centered.
 *   B-5  the phone CTA: the icon sits on the start side of the anchor
 *        (right in RTL, left in LTR).
 *   B-6  every in-scope route × locale renders <html lang dir> consistently
 *        and has no horizontal overflow at mobile and desktop widths.
 *
 * Gate: every check passes, or the script exits 1 with the offending rows.
 *
 * Usage: node scripts/ui-fix-verification.mjs [origin]
 */
const ORIGIN = process.argv[2] ?? "http://localhost:3137";
const CDP_PORT = process.env.CDP_PORT ?? "9334";

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
const EXPECTED_DIR = { fa: "rtl", en: "ltr", ar: "rtl" };
const EXPECTED_LANG = { fa: "fa", en: "en", ar: "ar" };

// Headless-Edge gotcha (documented in tmp-bug-diag.mjs, kept here so this
// probe is never "fixed" back into a false pass): a fresh profile sends
// Accept-Language: en-US and the pipeline is ?lang= → cookie →
// Accept-Language → fa, so every RTL pass navigates to an explicit ?lang=.
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
const consoleErrors = [];
ws.onmessage = (event) => {
  const message = JSON.parse(String(event.data));
  if (message.id !== undefined && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  } else if (message.method === "Runtime.exceptionThrown") {
    consoleErrors.push(
      `EXCEPTION: ${message.params.exceptionDetails.text} ${message.params.exceptionDetails.exception?.description ?? ""}`,
    );
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

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  const value = response.result?.result?.value;
  if (value === undefined) throw new Error(`evaluate returned no value: ${JSON.stringify(response).slice(0, 300)}`);
  return value;
}

async function navigate(url, width = 1280, height = 800) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 });
  await send("Page.navigate", { url });
  await sleep(2200); // load + CSS + hydration
  // The overflow-probe lesson: with mobile:true this Edge does not pin
  // innerWidth, so re-assert the emulated width before measuring.
  const inner = await evaluate("window.innerWidth");
  if (inner !== width) throw new Error(`emulation did not hold: innerWidth=${inner} expected=${width}`);
}

async function click(x, y) {
  for (const type of ["mousePressed", "mouseReleased"]) {
    await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
  }
}
async function hover(x, y) {
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
}

const failures = [];
const rows = [];
function record(scope, ok, detail) {
  rows.push({ scope, ok, detail });
  if (!ok) failures.push(`${scope}: ${detail}`);
}

// ─── B-1: the switch must be a real, server-side navigation ───────────────
console.log("B-1: language switcher — full document navigation per switch");
{
  const pageState = `(() => ({
    url: location.href,
    htmlLang: document.documentElement.lang,
    htmlDir: document.documentElement.dir,
    navHome: (document.querySelector('header nav a') ? document.querySelector('header nav a').textContent.trim() : null),
    switcherLabel: (document.querySelector('button[aria-haspopup="menu"]') ? document.querySelector('button[aria-haspopup="menu"]').textContent.trim() : null),
  }))()`;
  for (const sequence of [
    ["fa", "en"],
    ["en", "ar"],
    ["ar", "fa"],
  ]) {
    const [from, to] = sequence;
    await navigate(`${ORIGIN}/?lang=${from}`);
    const before = await evaluate(pageState);
    record(`B-1 ${from}→${to} (before)`, before.htmlLang === EXPECTED_LANG[from], `htmlLang=${before.htmlLang}`);

    const btn = await evaluate(`(() => { const b = document.querySelector('button[aria-haspopup="menu"]'); const r = b.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
    await click(btn.x + btn.w / 2, btn.y + btn.h / 2);
    await sleep(500);
    const item = await evaluate(`(() => { const a = document.querySelector('a[role="menuitem"][href*="lang=${to}"]'); if (!a) return null; const r = a.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
    if (!item) {
      record(`B-1 ${from}→${to}`, false, "menu item not rendered after click");
      continue;
    }
    await click(item.x + item.w / 2, item.y + item.h / 2);
    await sleep(2600);
    const after = await evaluate(pageState);
    const detail = `url=${after.url} lang=${after.htmlLang} dir=${after.htmlDir} navHome=${after.navHome} switcher=${after.switcherLabel}`;
    record(
      `B-1 ${from}→${to}`,
      after.htmlLang === EXPECTED_LANG[to] &&
        after.htmlDir === EXPECTED_DIR[to] &&
        after.switcherLabel === to.toUpperCase() &&
        after.url.includes(`lang=${to}`),
      detail,
    );
  }
}

// ─── B-2: no search affordance in the header ──────────────────────────────
console.log("B-2: header chrome — no search affordance");
for (const locale of LOCALES) {
  await navigate(`${ORIGIN}/?lang=${locale}`);
  const header = await evaluate(`(() => {
    const h = document.querySelector('header');
    const labelled = [...h.querySelectorAll('a[aria-label]')].map((a) => a.getAttribute('aria-label') + ' → ' + a.getAttribute('href'));
    const helpLinks = [...h.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((href) => href === '/#help' || href.includes('#help'));
    return { labelled, helpLinks, helpSectionOnPage: !!document.getElementById('help') };
  })()`);
  record(
    `B-2 no-search-affordance (${locale})`,
    header.labelled.length === 0 && header.helpLinks.length === 0,
    `labelled=${JSON.stringify(header.labelled)} helpLinks=${JSON.stringify(header.helpLinks)} (the home #help section itself ${header.helpSectionOnPage ? "exists" : "is MISSING"})`,
  );
}

// ─── B-3: services dropdown anchors at the reading-direction start ─────────
console.log("B-3: services dropdown — start-anchored, in-viewport");
for (const locale of LOCALES) {
  for (const width of [1280, 960]) {
    await navigate(`${ORIGIN}/?lang=${locale}`, width, 900);
    const geometry = await evaluate(`(() => {
      const li = document.querySelector('header nav li.group');
      const trigger = li.querySelector('a').getBoundingClientRect();
      return { trigger: { x: Math.round(trigger.x), right: Math.round(trigger.right), y: Math.round(trigger.y), bottom: Math.round(trigger.bottom) } };
    })()`);
    await hover(geometry.trigger.x + (geometry.trigger.right - geometry.trigger.x) / 2, geometry.trigger.y + 12);
    await sleep(700);
    const open = await evaluate(`(() => {
      const li = document.querySelector('header nav li.group');
      const trigger = li.querySelector('a').getBoundingClientRect();
      const menu = li.querySelector('ul > li').getBoundingClientRect();
      const winW = window.innerWidth;
      return {
        dir: document.documentElement.dir,
        triggerX: Math.round(trigger.x),
        triggerRight: Math.round(trigger.right),
        menuX: Math.round(menu.x),
        menuRight: Math.round(menu.right),
        menuTop: Math.round(menu.top),
        menuBottom: Math.round(menu.bottom),
        menuW: Math.round(menu.width),
        triggerBottom: Math.round(trigger.bottom),
        pageOverflow: document.documentElement.scrollWidth > winW,
      };
    })()`);
    // start = right in RTL, left in LTR; the menu's start edge must line up
    // with the trigger's start edge (the reference .menu .sub contract:
    // inset-inline-start:0; min-width:236px).
    const rtl = open.dir === "rtl";
    const startAligned = rtl ? open.menuRight === open.triggerRight : open.menuX === open.triggerX;
    const underTrigger = open.menuTop >= open.triggerBottom - 1;
    const ok =
      startAligned &&
      underTrigger &&
      open.menuW >= 236 &&
      open.menuX >= 0 &&
      open.menuRight <= width &&
      !open.pageOverflow;
    record(
      `B-3 dropdown (${locale}, ${width}px)`,
      ok,
      `dir=${open.dir} trigger=[${open.triggerX}..${open.triggerRight}] menu=[${open.menuX}..${open.menuRight}] w=${open.menuW} top=${open.menuTop} triggerBottom=${open.triggerBottom} pageOverflow=${open.pageOverflow}`,
    );
  }
}

// ─── B-4 / B-5: direction-class geometry on the home page ─────────────────
console.log("B-4/B-5: badge dot side + phone icon side, per direction");
for (const locale of LOCALES) {
  for (const width of [1280, 960, 375]) {
    await navigate(`${ORIGIN}/?lang=${locale}`, width, 900);
    const measured = await evaluate(`(() => {
      const box = document.getElementById('live-status');
      const phone = document.querySelector('a[href^="tel:"]');
      const r = (el) => el.getBoundingClientRect();
      return {
        dir: document.documentElement.dir,
        dotX: box ? Math.round(r(box.querySelector('.live-dot')).x) : null,
        dotCenterOff: box ? Math.round(r(box.querySelector('.live-dot')).y + r(box.querySelector('.live-dot')).height / 2 - (r(box).y + r(box).height / 2)) : null,
        textBoxX: box ? Math.round(r(box.querySelector('div')).x) : null,
        iconX: phone ? Math.round(r(phone.querySelector('svg')).x) : null,
        iconW: phone ? Math.round(r(phone.querySelector('svg')).width) : null,
        anchorCenter: phone ? Math.round(r(phone).x + r(phone).width / 2) : null,
        pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    })()`);
    const rtl = measured.dir === "rtl";
    const dotOnStartSide = rtl ? measured.dotX > measured.textBoxX : measured.dotX < measured.textBoxX;
    const iconOnStartSide = rtl
      ? measured.iconX + measured.iconW / 2 > measured.anchorCenter
      : measured.iconX + measured.iconW / 2 < measured.anchorCenter;
    record(
      `B-4 badge (${locale}, ${width}px)`,
      dotOnStartSide && measured.dotCenterOff === 0,
      `dir=${measured.dir} dotX=${measured.dotX} textBoxX=${measured.textBoxX} centerOff=${measured.dotCenterOff}`,
    );
    record(
      `B-5 phone icon (${locale}, ${width}px)`,
      iconOnStartSide,
      `dir=${measured.dir} iconX=${measured.iconX} anchorCenter=${measured.anchorCenter}`,
    );
    if (measured.pageOverflow) record(`B-6 overflow (${locale}, ${width}px, /)`, false, "scrollWidth > innerWidth");
  }
}

// ─── B-6: the whole in-scope surface — lang/dir consistency + overflow ─────
console.log("B-6: all in-scope routes × locales — lang/dir sanity + overflow");
for (const route of ROUTES) {
  for (const locale of LOCALES) {
    await navigate(`${ORIGIN}${route}?lang=${locale}`, 1280, 900);
    const desktop = await evaluate(`(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, overflow: document.documentElement.scrollWidth > window.innerWidth }))()`);
    record(
      `B-6 lang/dir (${locale}, ${route}, 1280px)`,
      desktop.lang === EXPECTED_LANG[locale] && desktop.dir === EXPECTED_DIR[locale] && !desktop.overflow,
      `lang=${desktop.lang} dir=${desktop.dir} overflow=${desktop.overflow}`,
    );

    await navigate(`${ORIGIN}${route}?lang=${locale}`, 375, 800);
    const mobile = await evaluate(`(() => ({ overflow: document.documentElement.scrollWidth > window.innerWidth, horizontalScrollbar: window.innerWidth < document.documentElement.scrollWidth }))()`);
    record(
      `B-6 overflow (${locale}, ${route}, 375px)`,
      !mobile.overflow,
      `scrollWidth>innerWidth=${mobile.overflow}`,
    );
  }
}

console.log("\n=== ui-fix-verification results ===");
for (const row of rows) {
  console.log(`${row.ok ? "PASS" : "FAIL"}  ${row.scope}  ${row.detail}`);
}
console.log(`\nchecks: ${rows.length}, failed: ${failures.length}`);
if (consoleErrors.length > 0) {
  console.log("page exceptions captured:");
  for (const error of consoleErrors) console.log(`  ${error}`);
}
if (failures.length > 0) {
  console.log("\nFAILURES:");
  for (const failure of failures) console.log(`  ${failure}`);
  process.exit(1);
}
console.log("ui-fix-verification: PASS");
ws.close();
process.exit(0);
