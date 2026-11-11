/**
 * keyboard-pass.mjs — keyboard-only navigation pass over CDP (Part A Decision B / R-6).
 *
 * The Phase 1 release gate "keyboard-only pass at 375 px and 1440 px"
 * (SEO_ACCESSIBILITY_SECURITY.md §8.2), executed for real: on every built
 * route, at both target widths, this drives actual Tab / Shift+Tab key events
 * through the system Edge (Input.dispatchKeyEvent, the same input pipeline a
 * real keyboard goes through) and records which element receives focus at each
 * step. It then verifies:
 *
 *   1. the skip link is the FIRST focusable element in the page;
 *   2. activating the skip link (real Enter keydown) lands on/scrolls to
 *      `#main-content` — never a dead anchor;
 *   3. every element that is tabbable at rest is reachable by Tab alone (no
 *      element is skipped by keyboard that mouse users could reach), and
 *      nothing off-list ever receives focus;
 *   4. the tab order is the DOM order (no positive `tabindex` jumps);
 *   5. focus is never lost mid-page: the walk ends either by covering every
 *      rest-tabble element (the remaining Tab steps leave the document for
 *      the browser chrome, which resets activeElement to <body> — that is the
 *      normal end of a page, not a trap) or by cycling back to the first
 *      element (a modal-style focus trap);
 *   6. every element shows a visible focus indicator when focused (the global
 *      `:focus-visible` ring — typography.css), including the items hidden
 *      inside the two disclosure menus, which are exercised through their
 *      real keyboard paths: the burger at 375 px (Enter → Tab in → ring →
 *      Escape with focus restored) and the desktop services sub-menu at
 *      1440 px (focus-within reveal → Tab in → ring → Tab out);
 *   7. the language-switcher disclosure opens on Enter and accepts Tab into
 *      its menu items at both widths.
 *
 * Elements that are `visibility:hidden` only at rest (the sub-menu links
 * under `group-focus-within`) are correctly NOT tabbable at rest; they are
 * expected to appear in the walk exactly when their disclosure reveals them,
 * and their focus ring is measured while they are actually revealed.
 *
 * No new dependencies: Node's built-in WebSocket and fetch only.
 *
 * Usage: node scripts/keyboard-pass.mjs [origin]
 */
const ORIGIN = process.argv[2] ?? "http://localhost:3137";
const WIDTHS = [375, 1440];
const HEIGHT = 900;

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

async function key(type, keyName, code, keyCode, text = undefined) {
  await send("Input.dispatchKeyEvent", {
    type,
    key: keyName,
    code,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
    ...(text === undefined ? {} : { text }),
  });
}

async function tab(forward = true) {
  const mods = forward ? [] : [{ keyCode: 16, code: "ShiftLeft", key: "Shift", type: "keyDown" }];
  for (const mod of mods) {
    await send("Input.dispatchKeyEvent", { ...mod, windowsVirtualKeyCode: mod.keyCode });
  }
  await key("keyDown", "Tab", "Tab", 9);
  await key("keyUp", "Tab", "Tab", 9);
  for (const mod of mods) {
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Shift",
      code: "ShiftLeft",
      windowsVirtualKeyCode: 16,
    });
  }
}

async function enter() {
  // The char text is load-bearing: without `text: "\r"` Chromium runs the
  // keydown but NOT its default action, so a focused <button> never receives
  // its click (verified with a capture-phase event probe against the burger —
  // keydown+keyup with no click; with text, keydown→click→keyup, exactly the
  // real keyboard sequence; Space likewise activates on keyup).
  await key("keyDown", "Enter", "Enter", 13, "\r");
  await key("keyUp", "Enter", "Enter", 13);
}

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, returnByValue: true });
  const raw = response.result?.result?.value;
  if (typeof raw !== "string") throw new Error(`evaluate returned no value: ${JSON.stringify(response).slice(0, 200)}`);
  return raw;
}

await send("Page.enable");
await send("Runtime.enable");

// The tabbable set + the focused-element descriptor, evaluated in the page.
// The selector covers every natively focusable element (including <summary>),
// not just the handful the earlier version listed — a `<summary>` accordion
// header is keyboard-focusable, so a walk that never sees it is a false pass.
// `visibleAtRest` marks elements hidden inside a focus-within disclosure: they
// are excluded from the rest-time expected list but may legitimately join the
// walk once their disclosure reveals them.
const FOCUSABLES = `(() => {
  const selector = "a[href], area[href], button:not([disabled]), input:not([disabled]):not([type='hidden']), select:not([disabled]), textarea:not([disabled]), iframe, summary:not([tabindex='-1']), [contenteditable]:not([contenteditable='false']), [tabindex]:not([tabindex='-1']), video[controls], audio[controls]";
  const tabbable = [];
  for (const element of document.querySelectorAll(selector)) {
    if (element.getAttribute("tabindex") === "-1") continue;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const sizeOk = rect.width > 0 || rect.height > 0;
    const shown = style.visibility !== "hidden" && style.display !== "none";
    const ariaHidden = element.closest("[aria-hidden='true']");
    if (ariaHidden !== null) continue;
    tabbable.push({
      tag: element.tagName,
      cls: (typeof element.className === "string" ? element.className : "").slice(0, 60),
      text: (element.textContent ?? "").trim().slice(0, 40),
      href: element.getAttribute("href") ?? "",
      tabIndex: element.tabIndex,
      visibleAtRest: sizeOk && shown,
    });
  }
  return JSON.stringify(tabbable);
})()`;

const ACTIVE = `(() => {
  const element = document.activeElement;
  if (element === null || element === document.body) return JSON.stringify(null);
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return JSON.stringify({
    tag: element.tagName,
    cls: (typeof element.className === "string" ? element.className : "").slice(0, 60),
    text: (element.textContent ?? "").trim().slice(0, 40),
    id: element.id,
    href: element.getAttribute("href") ?? "",
    outlineWidth: style.outlineWidth,
    outlineStyle: style.outlineStyle,
    outlineColor: style.outlineColor,
    boxShadow: style.boxShadow,
    visible: rect.width > 0 && rect.height > 0,
    onScreen: rect.top >= -40 && rect.bottom <= window.innerHeight + 40,
  });
})()`;

const SKIP_LINK_ACTIVATION = `(() => {
  const target = document.getElementById("main-content");
  return JSON.stringify({
    skipLinkFirst: document.querySelector("a.skip-link") !== null,
    targetExists: target !== null,
    hash: location.hash,
    before: { y: Math.round(window.scrollY) },
  });
})()`;

/**
 * Focus every tabbable element directly and read back its computed focus ring,
 * so the indicator check covers elements that were never the resting point of
 * a Tab chain (e.g. the last element before the cycle).
 *
 * Elements that are `visibility:hidden` at rest (the sub-menu links inside a
 * `group-focus-within` disclosure) deliberately CANNOT receive programmatic
 * focus — a hidden element is correctly excluded from the tab order. They are
 * returned as `hidden` and their ring is measured afterwards through the real
 * keyboard path (DISCLOSURE_* below), while they are actually revealed.
 */
const FOCUS_RING_PASS = `(() => {
  const selector = "a[href], button:not([disabled]), summary, [tabindex]:not([tabindex='-1'])";
  const missing = [];
  const hidden = [];
  for (const element of document.querySelectorAll(selector)) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (getComputedStyle(element).visibility === "hidden") {
      hidden.push({
        tag: element.tagName,
        cls: (typeof element.className === "string" ? element.className : "").slice(0, 60),
      });
      continue;
    }
    const before = getComputedStyle(element);
    const base = { outline: before.outlineWidth + before.outlineStyle, shadow: before.boxShadow };
    element.focus();
    if (document.activeElement !== element) continue; // not focusable at rest
    const after = getComputedStyle(element);
    const focused = { outline: after.outlineWidth + after.outlineStyle, shadow: after.boxShadow };
    const ring =
      (after.outlineStyle !== "none" && parseFloat(after.outlineWidth) >= 2) ||
      (after.boxShadow !== "none" && base.shadow !== after.boxShadow);
    if (!ring) {
      missing.push({
        tag: element.tagName,
        cls: (typeof element.className === "string" ? element.className : "").slice(0, 60),
        text: (element.textContent ?? "").trim().slice(0, 40),
        base,
        focused,
      });
    }
  }
  document.body.focus();
  return JSON.stringify({ missing, hidden });
})()`;

let problems = 0;
let pageRuns = 0;

for (const width of WIDTHS) {
  for (const route of ROUTES) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: HEIGHT,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: `${ORIGIN}${route}?lang=fa` });
    await sleep(1100);
    pageRuns += 1;

    let tabbable;
    try {
      tabbable = JSON.parse(await evaluate(FOCUSABLES));
    } catch (error) {
      console.log(`INVALID  [${width}]${route}  focusables list failed: ${error.message}`);
      problems += 1;
      continue;
    }
    if (tabbable.length === 0) {
      console.log(`FAIL     [${width}]${route}  zero tabbable elements`);
      problems += 1;
      continue;
    }

    const signature = (descriptor) =>
      descriptor === null ? "<none>" : `${descriptor.tag}.${descriptor.cls}|${descriptor.text}|${descriptor.href}`;
    // Rest-tabble elements must all be reached; every selector match (even a
    // focus-within-hidden one) is a legal walk stop, so "off-list" only fires
    // for elements that match nothing at all.
    const expectedRest = tabbable.filter((element) => element.visibleAtRest).map(signature);
    const expectedAll = new Set(tabbable.map(signature));
    const expectedFirst = expectedRest[0];

    const routeProblems = [];

    // 1. Skip link first.
    let skipInfo;
    try {
      skipInfo = JSON.parse(await evaluate(SKIP_LINK_ACTIVATION));
    } catch {
      skipInfo = null;
    }
    if (skipInfo === null || !skipInfo.skipLinkFirst) routeProblems.push("no a.skip-link element");
    else if (expectedFirst === undefined || !signature(tabbable[0]).startsWith("A.skip-link")) {
      routeProblems.push(`first tabbable is not the skip link (it is ${signature(tabbable[0])})`);
    }
    if (skipInfo !== null && !skipInfo.targetExists) routeProblems.push("skip-link target #main-content does not exist");

    // 2. Walk the real Tab order and collect the focus sequence.
    const sequence = [];
    const maxSteps = tabbable.length * 2 + 8;
    let lostEarly = false;
    let cycledBack = false;
    const visited = () => new Set(sequence.filter((sig) => sig !== "<none>"));
    for (let step = 0; step < maxSteps; step += 1) {
      await tab(true);
      await sleep(45);
      let active;
      try {
        active = JSON.parse(await evaluate(ACTIVE));
      } catch {
        active = null;
      }
      const sig = signature(active);
      sequence.push(sig);
      if (sig === expectedFirst && step > 0) {
        cycledBack = true;
        break; // focus cycled back to the first element (a trap page)
      }
      if (sig === "<none>") {
        // Focus left the document (Tab past the last element hands focus to
        // the browser chrome, resetting activeElement to <body>). That is the
        // normal end of the walk — only a problem if elements remain unread.
        const remaining = expectedRest.filter((s) => !visited().has(s));
        if (remaining.length > 0) lostEarly = true;
        break;
      }
    }

    // 3. Coverage + off-list.
    const visitedSet = visited();
    const unreached = expectedRest.filter((sig) => !visitedSet.has(sig));
    const unexpected = [...visitedSet].filter((sig) => !expectedAll.has(sig));
    if (unreached.length > 0) {
      routeProblems.push(`${unreached.length} tabbable element(s) unreachable by Tab: ${unreached.slice(0, 3).join(" ; ")}`);
    }
    if (unexpected.length > 0) {
      routeProblems.push(`focus landed off-list (${unexpected.length} distinct): ${unexpected.slice(0, 3).join(" ; ")}`);
    }
    if (lostEarly) {
      routeProblems.push("focus was LOST (activeElement = body) before the Tab walk covered every tabbable element");
    } else if (!cycledBack && unreached.length === 0 && sequence.length >= maxSteps) {
      routeProblems.push(`Tab walked ${maxSteps} steps without covering the page or cycling back (possible trap)`);
    }

    // 4. Positive tabindex jumps (DOM order must be the tab order).
    const positive = tabbable.filter((element) => element.tabIndex > 0);
    if (positive.length > 0) {
      routeProblems.push(`${positive.length} element(s) with positive tabindex: ${positive.map((element) => element.tabIndex).slice(0, 4)}`);
    }

    // 5. Skip-link activation: focus the skip link, press Enter, verify the
    //    document moves to #main-content (scroll change or focus onto it).
    if (skipInfo !== null && skipInfo.skipLinkFirst && skipInfo.targetExists) {
      await evaluate(`(() => { document.querySelector("a.skip-link").focus(); return "ok"; })()`);
      await sleep(80);
      await enter();
      await sleep(300);
      const after = JSON.parse(
        await evaluate(`JSON.stringify({ y: Math.round(window.scrollY), hash: location.hash, active: (document.activeElement && document.activeElement.id) || (document.activeElement && document.activeElement.tagName) || "none" })`),
      );
      // Evidence of a real activation, in priority order: the URL fragment
      // flipped to #main-content (deterministic even on short pages where the
      // target is already in view and there is nothing to scroll), focus moved
      // onto the target, or the view actually scrolled. scrollY alone is NOT
      // sufficient — on the short category pages the target sits at the top.
      const activated = after.hash === "#main-content" || after.active === "main-content" || after.y > skipInfo.before.y;
      if (!activated) {
        routeProblems.push(`skip-link Enter did not activate the anchor (hash ${skipInfo.hash} → ${after.hash}, scrollY ${skipInfo.before.y} → ${after.y}, active=${after.active})`);
      }
    }

    // 6. Keyboard-operable disclosure nav (burger, 375 px only — at 1440 px it
    //    is display:none and not part of the tab order). Real keys: Enter to
    //    open, Tab into the disclosed links (with a visible focus ring there),
    //    Escape to close with focus restored to the burger (MobileMenu.tsx).
    //    The burger is selected by aria-controls, NOT aria-expanded — the
    //    language switcher's opener also carries aria-expanded and sits earlier
    //    in the DOM, so the older selector tested the wrong button.
    if (width === 375) {
      const burgerState = JSON.parse(
        await evaluate(`(() => {
          const burger = document.querySelector("button[aria-controls='mobile-menu']");
          if (burger === null) return JSON.stringify({ missing: true });
          burger.focus();
          return JSON.stringify({ missing: false, expanded: burger.getAttribute("aria-expanded") });
        })()`),
      );
      if (burgerState.missing) {
        routeProblems.push("no burger button (button[aria-controls='mobile-menu']) found at 375 px");
      } else if (burgerState.expanded !== "false") {
        routeProblems.push(`burger initial aria-expanded is ${burgerState.expanded}, expected "false"`);
      } else {
        await enter();
        await sleep(220);
        const opened = JSON.parse(
          await evaluate(`(() => {
            const burger = document.querySelector("button[aria-controls='mobile-menu']");
            const panel = document.getElementById("mobile-menu");
            return JSON.stringify({
              expanded: burger.getAttribute("aria-expanded"),
              panelOpen: panel !== null,
              links: panel === null ? 0 : panel.querySelectorAll("a").length,
            });
          })()`),
        );
        if (opened.expanded !== "true" || !opened.panelOpen) {
          routeProblems.push(`Enter on burger did not open the menu (expanded=${opened.expanded}, panelOpen=${opened.panelOpen})`);
        } else if (opened.links === 0) {
          routeProblems.push("open mobile menu contains zero links");
        } else {
          // Tab from the burger into the disclosed menu and verify focus lands
          // on a link inside #mobile-menu and that the link carries a ring.
          await tab(true);
          await sleep(60);
          const inMenu = JSON.parse(
            await evaluate(`(() => {
              const active = document.activeElement;
              const inside = active !== null && active.closest("#mobile-menu") !== null;
              if (!inside) return JSON.stringify({ inside: false, ring: false });
              const style = getComputedStyle(active);
              return JSON.stringify({
                inside: true,
                ring: style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2,
                outline: style.outlineWidth + " " + style.outlineStyle,
              });
            })()`),
          );
          if (!inMenu.inside) {
            const active = JSON.parse(await evaluate(ACTIVE));
            routeProblems.push(`Tab after opening the menu did not enter it (active=${signature(active)})`);
          } else if (!inMenu.ring) {
            routeProblems.push(`focused mobile-menu link has no visible focus ring (outline=${inMenu.outline})`);
          }
          // Escape closes the menu and returns focus to the burger.
          await key("keyDown", "Escape", "Escape", 27);
          await key("keyUp", "Escape", "Escape", 27);
          await sleep(220);
          const closed = JSON.parse(
            await evaluate(`(() => {
              const burger = document.querySelector("button[aria-controls='mobile-menu']");
              return JSON.stringify({
                expanded: burger.getAttribute("aria-expanded"),
                focusOnBurger: document.activeElement === burger,
                panelGone: document.getElementById("mobile-menu") === null,
              });
            })()`),
          );
          if (closed.expanded !== "false" || !closed.panelGone || !closed.focusOnBurger) {
            routeProblems.push(
              `Escape did not close the menu and restore focus (expanded=${closed.expanded}, panelGone=${closed.panelGone}, focusOnBurger=${closed.focusOnBurger})`,
            );
          }
        }
      }
    }

    // 7. Desktop services sub-menu (1440 px only): at rest it is
    //    visibility:hidden and correctly NOT tabbable, but focusing the
    //    parent services link reveals it via group-focus-within — so the real
    //    keyboard path is: focus parent → Tab lands on a revealed sub-link
    //    (with a ring) → Tab again leaves the sub-menu without losing focus.
    if (width === 1440) {
      const submenu = JSON.parse(
        await evaluate(`(() => {
          const parent = document.querySelector("nav a[href='/services']");
          if (parent === null) return JSON.stringify({ missing: true });
          parent.focus();
          return JSON.stringify({ missing: false });
        })()`),
      );
      if (submenu.missing) {
        routeProblems.push("no desktop services nav link (nav a[href='/services']) found at 1440 px");
      } else {
        await sleep(120);
        await tab(true);
        await sleep(60);
        const into = JSON.parse(
          await evaluate(`(() => {
            const active = document.activeElement;
            const link = active !== null ? active.getAttribute("href") : null;
            const inside = link === "/services#surgical" || link === "/services#medical";
            if (!inside) return JSON.stringify({ inside: false });
            const style = getComputedStyle(active);
            return JSON.stringify({
              inside: true,
              ring: style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2,
              outline: style.outlineWidth + " " + style.outlineStyle,
            });
          })()`),
        );
        if (!into.inside) {
          const active = JSON.parse(await evaluate(ACTIVE));
          routeProblems.push(`Tab from the services link did not enter the revealed sub-menu (active=${signature(active)})`);
        } else if (!into.ring) {
          routeProblems.push(`revealed sub-menu link has no visible focus ring (outline=${into.outline})`);
        } else {
          // Tab out of the sub-menu: there are two sub-links, so step until
          // focus leaves the revealed list (max 4 steps), then require the
          // contact link — the next tabbable element after the group.
          let exitHref = null;
          let exitTag = null;
          let dropped = false;
          for (let step = 0; step < 4; step += 1) {
            await tab(true);
            await sleep(60);
            const out = JSON.parse(
              await evaluate(`(() => {
                const active = document.activeElement;
                if (active === document.body) return JSON.stringify({ body: true });
                const href = active !== null && active.getAttribute ? active.getAttribute("href") : null;
                const stillInside = href === "/services#surgical" || href === "/services#medical";
                return JSON.stringify({ body: false, inside: stillInside, href, tag: active !== null ? active.tagName : "none" });
              })()`),
            );
            if (out.body) {
              dropped = true;
              break;
            }
            if (!out.inside) {
              exitHref = out.href;
              exitTag = out.tag;
              break;
            }
          }
          if (dropped) {
            routeProblems.push("Tab out of the revealed sub-menu dropped focus to <body>");
          } else if (exitHref !== "/#contact") {
            routeProblems.push(`Tab out of the sub-menu went somewhere unexpected (href=${exitHref} tag=${exitTag})`);
          }
        }
      }
    }

    // 8. Language switcher (both widths): its opener is a real <button> —
    //    Enter must open the menu, and Tab must then enter the menu items.
    //    Run last: it leaves the menu open, which is fine because the run is
    //    over and the next iteration re-navigates.
    {
      const switcher = JSON.parse(
        await evaluate(`(() => {
          const opener = document.querySelector(".relative button[aria-haspopup='menu']");
          if (opener === null) return JSON.stringify({ missing: true });
          opener.focus();
          return JSON.stringify({ missing: false });
        })()`),
      );
      if (switcher.missing) {
        routeProblems.push("no language-switcher opener button found");
      } else {
        await enter();
        await sleep(200);
        const opened = JSON.parse(
          await evaluate(`(() => {
            const menu = document.querySelector("ul[role='menu']");
            return JSON.stringify({
              open: menu !== null,
              items: menu === null ? 0 : menu.querySelectorAll("a[role='menuitem']").length,
            });
          })()`),
        );
        if (!opened.open || opened.items === 0) {
          routeProblems.push(`Enter on the language switcher did not open its menu (open=${opened.open}, items=${opened.items})`);
        } else {
          await tab(true);
          await sleep(60);
          const into = JSON.parse(
            await evaluate(`(() => {
              const active = document.activeElement;
              const inside = active !== null && active.getAttribute("role") === "menuitem";
              if (!inside) return JSON.stringify({ inside: false });
              const style = getComputedStyle(active);
              return JSON.stringify({ inside: true, ring: style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2 });
            })()`),
          );
          if (!into.inside) {
            const active = JSON.parse(await evaluate(ACTIVE));
            routeProblems.push(`Tab after opening the switcher did not enter its menu (active=${signature(active)})`);
          } else if (!into.ring) {
            routeProblems.push("focused language-menu item has no visible focus ring");
          }
        }
      }
    }

    let ringMissing;
    try {
      ringMissing = JSON.parse(await evaluate(FOCUS_RING_PASS));
    } catch {
      ringMissing = null;
    }
    if (ringMissing === null) {
      routeProblems.push("focus-ring measurement INVALID (no value) — not counted as pass");
    } else if (ringMissing.missing.length > 0) {
      routeProblems.push(
        `${ringMissing.missing.length} element(s) without a visible focus ring: ${ringMissing.missing.slice(0, 3).map((element) => `<${element.tag} class="${element.cls}">`).join(" ")}`,
      );
    }

    if (routeProblems.length === 0) {
      console.log(`ok      [${width}]${route}  tabbable=${tabbable.length} tabSteps=${sequence.length} coverage=ok ring=ok disclosures=ok skipLink=ok`);
    } else {
      problems += 1;
      console.log(`FAIL    [${width}]${route}  ${routeProblems.length} problem(s)`);
      for (const problem of routeProblems) console.log(`        → ${problem}`);
    }
  }
}

console.log(
  `\n${problems === 0 ? "PASS" : "FAIL"}: keyboard-only pass over ${pageRuns} page-runs (12 routes × ${WIDTHS.length} widths) — ` +
    `skip link first, Enter activation, full Tab coverage, DOM order, no lost focus, visible focus ring, disclosure menus`,
);
ws.close();
process.exit(problems === 0 ? 0 : 1);
