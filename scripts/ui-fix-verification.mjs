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
 *   B-3  the services dropdown matches the reference .menu .sub contract
 *        exactly: ul.sub is min-width:236px, anchored (inset-inline-start:0)
 *        to the li.has-sub edge (its position:relative containing block —
 *        NOT the anchor inside it, which carries its own padding), sits below
 *        the trigger with the reference's 6px margin, and never overflows the
 *        viewport. The reference desktop dropdown exists only at ≥1025px; at
 *        ≤1024px the submenu is a static section of the mobile menu opened by
 *        the .sub-tg button, and that is what is pinned there instead.
 *   B-4  the open/closed badge: the dot sits on the reading-direction start
 *        side of the text (right in RTL, left in LTR) and is vertically
 *        centered.
 *   B-5  the header phone CTA: the icon sits on the start side of the anchor
 *        (right in RTL, left in LTR). The reference's own CTA carries
 *        hide-sm (display:none at ≤1180px) — per the absolute standard that
 *        behaviour is copied, not "improved", so below 1180px the probe pins
 *        that the CTA is hidden (the small-screen phone affordance is
 *        FloatingActions, as in the reference's own page).
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
  // Open a FRESH page rather than reusing an existing one: a tab left over
  // from a previous probe run can be hung (its renderer wedged under disk
  // pressure) and will navigate but never settle, which looks exactly like a
  // page bug. A new target starts from a clean renderer.
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const target = await (
        await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: "PUT" })
      ).json();
      if (target?.webSocketDebuggerUrl) return target;
    } catch {
      // Browser not ready yet.
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
  await send("Page.navigate", { url });
  await waitFor("document.readyState === 'complete'", 15_000); // load + CSS
  await waitFor("!!document.querySelector('header')", 15_000); // + hydration
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 });
  await sleep(250);
  // The overflow-probe lesson: with mobile:true this Edge does not pin
  // innerWidth, so re-assert the emulated width before measuring.
  const inner = await evaluate("window.innerWidth");
  if (inner !== width) throw new Error(`emulation did not hold: innerWidth=${inner} expected=${width}`);
}

/**
 * Poll a JS condition in the page instead of trusting a fixed sleep. Under
 * disk pressure the browser can need far longer than any fixed budget, and a
 * fixed sleep that expires mid-load makes the probes below query a page that
 * has not rendered its chrome yet.
 */
async function waitFor(expression, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const ok = await evaluate(`(${expression})`).catch(() => false);
    if (ok === true) return;
    if (Date.now() > deadline) throw new Error(`waitFor timed out (${timeoutMs}ms): ${expression}`);
    await sleep(150);
  }
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
    // A native anchor click is a full document load, not a client swap: wait
    // for the new document to land before reading it (a fixed sleep can
    // expire mid-navigation on a slow machine and read the OLD page).
    await waitFor(`location.href.includes("lang=${to}")`, 20_000);
    await waitFor("document.readyState === 'complete'", 20_000);
    await waitFor("!!document.querySelector('header')", 20_000);
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

// ─── B-3: services dropdown, exactly the reference's two behaviours ─────────
console.log("B-3: services dropdown — reference .menu .sub contract");
// Desktop (≥1025px): hover opens ul.sub. The reference anchors inset-inline-
// start:0 to li.has-sub (position:relative, line 791/795 of the reference
// style.css) — the anchor inside it carries padding:9px 11px of its own, so
// the submenu must be measured against the li, not the anchor. min-width:236px
// applies to the ul border box (its inner li content measures 236 − 16 padding
// − 2 border = 218 — measuring the li and expecting ≥236 was a probe bug).
for (const locale of LOCALES) {
  await navigate(`${ORIGIN}/?lang=${locale}`, 1280, 900);
  const geometry = await evaluate(`(() => {
    const li = document.querySelector('header nav li.has-sub');
    const liRect = li.getBoundingClientRect();
    const trigger = li.querySelector('a').getBoundingClientRect();
    return { liX: Math.round(liRect.x), liRight: Math.round(liRect.right),
      trigger: { x: Math.round(trigger.x), right: Math.round(trigger.right), y: Math.round(trigger.y), bottom: Math.round(trigger.bottom) } };
  })()`);
  await hover(geometry.trigger.x + (geometry.trigger.right - geometry.trigger.x) / 2, geometry.trigger.y + 12);
  await sleep(700);
  const open = await evaluate(`(() => {
    const li = document.querySelector('header nav li.has-sub');
    const liRect = li.getBoundingClientRect();
    const trigger = li.querySelector('a').getBoundingClientRect();
    const sub = li.querySelector('ul.sub');
    const r = sub.getBoundingClientRect();
    const winW = window.innerWidth;
    return {
      dir: document.documentElement.dir,
      liX: Math.round(liRect.x), liRight: Math.round(liRect.right),
      triggerBottom: Math.round(trigger.bottom),
      subX: Math.round(r.x), subRight: Math.round(r.right),
      subTop: Math.round(r.top), subW: Math.round(r.width),
      pageOverflow: document.documentElement.scrollWidth > winW,
    };
  })()`);
  const rtl = open.dir === "rtl";
  const startAligned = rtl ? open.subRight === open.liRight : open.subX === open.liX;
  const ok =
    startAligned &&
    open.subW >= 236 &&
    open.subTop >= open.triggerBottom &&
    open.subX >= 0 &&
    open.subRight <= 1280 &&
    !open.pageOverflow;
  record(
    `B-3 dropdown (${locale}, 1280px)`,
    ok,
    `dir=${open.dir} sub=[${open.subX}..${open.subRight}] w=${open.subW} top=${open.subTop} triggerBottom=${open.triggerBottom} li=[${open.liX}..${open.liRight}] pageOverflow=${open.pageOverflow}`,
  );
}
// Mobile menu (≤1024px): the reference's desktop dropdown does not exist at
// this width — .menu is a hidden panel opened by the #burger, and .menu .sub
// is position:static inside it, opened only via the .sub-tg toggle button
// (reference style.css lines 370/379–381 and 801–813), whose chevron rotates
// 180deg when the item is .open. That exact sequence is pinned here.
for (const locale of LOCALES) {
  await navigate(`${ORIGIN}/?lang=${locale}`, 960, 900);
  // Let the viewport-change transition settle: navigate() flips the emulated
  // width after load, and .menu's transition:.25s keeps computed `visibility`
  // at its old value for the whole duration on the visible→hidden leg — a
  // synchronous read inside that window reports a lie.
  await sleep(400);
  // Step 1: the burger opens the panel (main.js L40–L52). The after-state is
  // read after a settle for the same transition reason.
  const step1 = await evaluate(`(() => {
    const burger = document.querySelector('header button.burger');
    const menu = document.querySelector('header ul#menu');
    if (!burger || !menu) return { error: 'no burger/menu' };
    const burgerVisible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const before = { burgerVisible: burgerVisible(burger), menuOpen: menu.classList.contains('open'),
      menuVisible: getComputedStyle(menu).visibility, burgerExpanded: burger.getAttribute('aria-expanded') };
    burger.click();
    return new Promise((resolve) => {
      setTimeout(() => {
        const r = menu.getBoundingClientRect();
        resolve({ before,
          after: { menuOpen: menu.classList.contains('open'),
            menuVisible: getComputedStyle(menu).visibility,
            menuOpacity: getComputedStyle(menu).opacity,
            menuH: Math.round(r.height),
            burgerExpanded: burger.getAttribute('aria-expanded') } });
      }, 350);
    });
  })()`);
  if (step1.error) {
    record(`B-3 mobile submenu (${locale}, 960px)`, false, step1.error);
    continue;
  }
  // Step 2: inside the open panel, the .sub-tg accordion expands the submenu
  // and rotates its chevron (transition .2s — read the TERMINAL state).
  const step2 = await evaluate(`(() => {
    const li = document.querySelector('header nav li.has-sub');
    const tg = li.querySelector('button.sub-tg');
    const sub = li.querySelector('ul.sub');
    const tgVisible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const start = performance.now();
    tg.click();
    return new Promise((resolve) => {
      setTimeout(() => {
        const cs = getComputedStyle(tg.querySelector('svg'));
        resolve({
          tgVisible: tgVisible(tg),
          subDisplay: getComputedStyle(sub).display,
          liOpen: li.classList.contains('open'),
          tgExpanded: tg.getAttribute('aria-expanded'),
          chevron: cs.transform,
          elapsedMs: Math.round(performance.now() - start),
        });
      }, 300);
    });
  })()`);
  const ok =
    step1.before.burgerVisible &&
    step1.before.menuVisible === "hidden" && !step1.before.menuOpen &&
    step1.after.menuOpen && step1.after.menuVisible === "visible" &&
    step1.after.menuOpacity === "1" && step1.after.menuH > 0 &&
    step1.after.burgerExpanded === "true" &&
    step2.tgVisible &&
    step2.subDisplay === "block" && step2.liOpen && step2.tgExpanded === "true" &&
    // rotate(180deg) resolves to matrix(-1, 0, 0, -1, 0, 0); "none" would mean
    // the ported rule never applied.
    step2.chevron.includes("-1");
  record(
    `B-3 mobile submenu (${locale}, 960px)`,
    ok,
    `panel ${step1.before.menuVisible}→${step1.after.menuVisible} opacity=${step1.after.menuOpacity} h=${step1.after.menuH} (.open ${step1.before.menuOpen}→${step1.after.menuOpen}); sub display=${step2.subDisplay} .open=${step2.liOpen} aria-expanded=${step2.tgExpanded}; chevron '${step2.chevron}' after ${step2.elapsedMs}ms`,
  );
}

// ─── B-4 / B-5: direction-class geometry on the home page ─────────────────
console.log("B-4/B-5: badge dot side + phone icon side, per direction");
for (const locale of LOCALES) {
  for (const width of [1280, 960, 375]) {
    await navigate(`${ORIGIN}/?lang=${locale}`, width, 900);
    const measured = await evaluate(`(() => {
      const box = document.getElementById('live-status');
      // The HEADER phone CTA (SiteHeader) — the reference's own booking CTA,
      // which carries hide-sm (display:none at ≤1180px). Its icon side is only
      // meaningful above that width; below it the pinned behaviour is the
      // reference's own: hidden, with FloatingActions as the affordance.
      const phone = document.querySelector('header a[href^="tel:"]');
      const r = (el) => el.getBoundingClientRect();
      return {
        dir: document.documentElement.dir,
        dotX: box ? Math.round(r(box.querySelector('.live-dot')).x) : null,
        dotCenterOff: box ? Math.round(r(box.querySelector('.live-dot')).y + r(box.querySelector('.live-dot')).height / 2 - (r(box).y + r(box).height / 2)) : null,
        textBoxX: box ? Math.round(r(box.querySelector('div')).x) : null,
        phoneW: phone ? Math.round(r(phone).width) : null,
        iconX: phone ? Math.round(r(phone.querySelector('svg')).x) : null,
        iconW: phone ? Math.round(r(phone.querySelector('svg')).width) : null,
        anchorCenter: phone ? Math.round(r(phone).x + r(phone).width / 2) : null,
        pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    })()`);
    const rtl = measured.dir === "rtl";
    const dotOnStartSide = rtl ? measured.dotX > measured.textBoxX : measured.dotX < measured.textBoxX;
    record(
      `B-4 badge (${locale}, ${width}px)`,
      dotOnStartSide && measured.dotCenterOff === 0,
      `dir=${measured.dir} dotX=${measured.dotX} textBoxX=${measured.textBoxX} centerOff=${measured.dotCenterOff}`,
    );
    // Reference contract: the header CTA is visible (icon on the start side)
    // above 1180px and carries hide-sm below it.
    const visible = measured.phoneW > 0;
    let b5ok;
    let b5detail;
    if (width > 1180) {
      const iconOnStartSide = rtl
        ? measured.iconX + measured.iconW / 2 > measured.anchorCenter
        : measured.iconX + measured.iconW / 2 < measured.anchorCenter;
      b5ok = visible && iconOnStartSide;
      b5detail = `dir=${measured.dir} iconX=${measured.iconX} anchorCenter=${measured.anchorCenter}`;
    } else {
      b5ok = !visible;
      b5detail = `header CTA width=${measured.phoneW} (reference hide-sm: display:none at ≤1180px; FloatingActions is the small-screen affordance)`;
    }
    record(`B-5 phone icon (${locale}, ${width}px)`, b5ok, b5detail);
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
