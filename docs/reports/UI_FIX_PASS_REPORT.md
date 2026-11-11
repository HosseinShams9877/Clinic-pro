# UI_FIX_PASS_REPORT — the owner's UI bug fix pass (B-1…B-6)

> Date: 2026-11-11 · Pass type per directive: **quality fix pass — not a phase,
> not a scope expansion**. No features, pages, or routes were added; no
> dependencies changed; Phase 3 was not started.
>
> Files changed: `src/components/layout/LanguageSwitcher.tsx` (B-1),
> `src/components/layout/SiteHeader.tsx` (B-2, B-3),
> `src/components/layout/LanguageSwitcher.test.tsx` (new, B-1 regression),
> `src/components/layout/SiteHeader.test.tsx` (B-2 regression, refrozen),
> `tests/phase2-baseline.manifest.json` + `docs/reports/PHASE_2_BASELINE.md`
> (refreeze record), `scripts/ui-fix-verification.mjs` (new CDP probe),
> `package.json` (one npm script entry: `ui-fix:verify`). **Nothing else.**
> The reference tree `پلتفرم/` was not touched: **114/114 files unchanged**
> (mtime probe, §4.6).

---

## 1. Per-bug account (B-1…B-5): root cause, fix, files, regression test, evidence

### B-1 — the language switcher did not switch locale

**Observed:** clicking the header "FA" button opened the menu, but selecting a
locale did not produce a usable switch. The page content flipped (h1, badge,
body text rendered in the new language) while `<html lang>`, `<html dir>`, the
header nav labels and the switcher's own label stayed at the previous locale —
e.g. English content under `dir="rtl"` with the switcher still reading "FA".
From the owner's seat that reads as "the button does not work".

**Root cause (confirmed against the code, then against the live build):** the
menu items in `src/components/layout/LanguageSwitcher.tsx` were
`next/link` `<Link>` components. A `?lang=` change is a **searchParams-only
update of the same route segment**: the client router re-renders the segment
(the page content flips) but **does not re-execute the root layout**, which is
the only place `<html lang>`/`<html dir>` and the server-rendered header
labels are produced. The `lang` cookie was never set either (no document
navigation happened), so the next hard load reverted. The server-side pipeline
from Phase 1 (`?lang=` → cookie → `Accept-Language` → fa, `src/middleware.ts`)
is correct — it simply never ran on click.

**Fix (`src/components/layout/LanguageSwitcher.tsx`):** the three menu items
are now **plain `<a href="{pathname}?lang={locale}">`**, never next/link. A
native anchor is a document navigation: middleware mirrors `?lang=` into the
`lang` cookie (`src/middleware.ts:21-34`), the server re-renders the whole
document from the cookie, and `<html lang>`, `<html dir>`, header labels and
the switcher label all flip with the content. It also works with JavaScript
disabled. Documented inline in the file header so it is not "fixed" back.

**Regression tests:**
- **Unit — `src/components/layout/LanguageSwitcher.test.tsx` (new, 3 tests).**
  Mocks `next/navigation` with a recording router; asserts every menu item is
  a native `<a>` with the exact `?lang=` href for all three locales built from
  the current pathname; asserts `aria-current` on the active option and menu
  close on selection; and asserts **`router.push` is never called on click**
  (`expect(pushCalls).toEqual([])`) — the decisive assertion: converting an
  item back to `<Link>` makes this test fail. (jsdom logs
  `Not implemented: navigation` on the click, which is the evidence the click
  really asked for a document navigation.)
- **CDP — `scripts/ui-fix-verification.mjs` §B-1.** Real Edge, real mouse
  events: opens the menu by clicking the button, clicks the target menu item,
  then asserts `location.href`, `documentElement.lang`, `documentElement.dir`,
  the header nav home label **and** the switcher label all match the target
  locale, for the round trip fa→en→ar→fa.

**Evidence (from the live production build, `ui-fix-verification: PASS`):**

```
PASS  B-1 fa→en (before)  htmlLang=fa
PASS  B-1 fa→en  url=…/?lang=en lang=en dir=ltr navHome=Home switcher=EN
PASS  B-1 en→ar (before)  htmlLang=en
PASS  B-1 en→ar  url=…/?lang=ar lang=ar dir=rtl navHome=الرئيسية switcher=AR
PASS  B-1 ar→fa (before)  htmlLang=ar
PASS  B-1 ar→fa  url=…/?lang=fa lang=fa dir=rtl navHome=خانه switcher=FA
```

### B-2 — the header search button did not work

**Observed:** the magnifier icon in the header did nothing meaningful.

**Root cause (evidence first, per the directive):** the button was an icon link
styled after the reference header (`پلتفرم/` `.icon-btn` with the `i-search`
glyph) whose `aria-label` read as a **search** action, but whose `href` was
`/#help` — the home page's telephone-guidance section. So the accessible name
promised a search action that no in-scope surface answers: **a fake button**
under CLAUDE.md §2 rule 4 ("No stub pages, fake buttons, or dead links for
anything beyond [the boundary]"). The reference has a search surface; the
rebuild's scope (public site through the complete Services section) does not.

**Fix (`src/components/layout/SiteHeader.tsx`):** **the button is removed
entirely.** Per the directive: "*if no in-scope search surface exists in
Phase 1/2, remove the button entirely*". No search feature was built. The
home `#help` section is untouched — only the header affordance is gone; the
header's action group is now the language switcher + the mobile burger.

**Regression tests:**
- **Unit — `src/components/layout/SiteHeader.test.tsx`** (frozen file, see §4):
  the old assertion that the header anchor set *contains* `/#help` was
  replaced by `carries no search affordance (B-2: no fake buttons)` —
  `header a[aria-label]` must be **0** (only the reference magnifier ever had
  one in the header), `hrefs` must not contain `/#help`, and no header link
  may carry the help/search accessible name. This is stronger than what it
  replaced: it pins the absence by a structural property, not one URL.
- **CDP — `scripts/ui-fix-verification.mjs` §B-2**, all three locales: zero
  labelled header links, no `#help` anchor in the header, **and** the `#help`
  section itself still present on the home page (so removal is scoped to the
  chrome, not the content).

**Evidence:**

```
PASS  B-2 no-search-affordance (fa)  labelled=[] helpLinks=[] (the home #help section itself exists)
PASS  B-2 no-search-affordance (en)  labelled=[] helpLinks=[] (the home #help section itself exists)
PASS  B-2 no-search-affordance (ar)  labelled=[] helpLinks=[] (the home #help section itself exists)
```

### B-3 — the "خدمات" dropdown opened to the wrong side in RTL and floated over content

**Observed:** in RTL the services dropdown stretched the full width of its
trigger and floated over page content instead of anchoring under it.

**Root cause:** the sub-menu `<ul>` used `inset-x-0` (both inline edges 0),
which pins the menu to the trigger's **full width** in both directions — no
reading-direction anchoring at all, and (combined with B-1's mixed-state
render) the dropdown's geometry was being measured while the document was in
the broken half-flipped state. The reference contract is explicit
(`پلتفرم/` `.menu .sub`): `position:absolute; top:100%;
inset-inline-start:0; min-width:236px` — i.e. **anchor at the reading-start
edge of the trigger, with a 236 px floor**.

**Fix (`src/components/layout/SiteHeader.tsx`):** the `<ul>` is now
`absolute start-0 top-full` (anchored at the inline-start edge, below the
trigger) and the inner `<li>` carries `min-w-[236px]`, mirroring the reference
contract. In RTL the menu's right edge lines up with the trigger's right edge
and extends left (right-to-left reading direction); in LTR the left edges line
up and it extends right. `z-10` + the existing `group-hover` /
`group-focus-within` visibility keep it keyboard-reachable with no JS.

**Process note worth recording (a real hazard):** the first rebuild after this
edit **reused Next's cached compiled CSS** — only `.tsx` had changed, so the
CSS hash was unchanged and the newly introduced `start-0` / `min-w-[236px]`
utilities shipped in the markup **with no matching CSS rules** (computed
`inset-inline-start: auto`, `min-width: 0px`), which made the probe correctly
fail (menu w=132 < 236). Deleting `.next` and rebuilding clean produced both
rules. The `menuW >= 236` check in the new CDP probe exists precisely to catch
this failure mode — a markup-only change that silently drops its CSS.

**Regression test (CDP — `scripts/ui-fix-verification.mjs` §B-3):** for each
locale at both 1280 px and 960 px: hover the trigger with a real mouse event,
then assert the menu's **start edge equals the trigger's start edge**
(RTL: `menuRight === triggerRight`; LTR: `menuX === triggerX`), `menuTop ≥
triggerBottom − 1`, `menuW ≥ 236`, the menu inside the viewport, and no page
overflow.

**Evidence:**

```
PASS  B-3 dropdown (fa, 1280px)  dir=rtl trigger=[565..658] menu=[422..658] w=236 top=66 triggerBottom=58 pageOverflow=false
PASS  B-3 dropdown (fa, 960px)   dir=rtl trigger=[405..498] menu=[262..498] w=236 top=66 triggerBottom=58 pageOverflow=false
PASS  B-3 dropdown (en, 1280px)  dir=ltr trigger=[635..743] menu=[635..871] w=236 top=66 triggerBottom=58 pageOverflow=false
PASS  B-3 dropdown (en, 960px)   dir=ltr trigger=[475..583] menu=[475..711] w=236 top=66 triggerBottom=58 pageOverflow=false
PASS  B-3 dropdown (ar, 1280px)  dir=rtl trigger=[536..638] menu=[402..638] w=236 top=66 triggerBottom=58 pageOverflow=false
PASS  B-3 dropdown (ar, 960px)   dir=rtl trigger=[376..478] menu=[242..478] w=236 top=66 triggerBottom=58 pageOverflow=false
```

### B-4 — the open/closed badge dot/text alignment

**Observed:** "پذیرش هم‌اکنون باز است" — the dot indicator and text alignment
looked wrong.

**Root cause (evidence):** honest finding — on a **clean, correctly-localized
load** the badge geometry was already correct (`flex` row with the dot first,
`gap`, centered). The visible wrongness was **B-1's mixed-state render**: the
badge was being displayed while the document direction and the content
disagreed, which is exactly when a direction-dependent row looks broken.
B-1's fix removes the mixed state. **No source change was needed for B-4**
beyond confirming the geometry — but it is now pinned by a regression test so
the class of bug cannot return silently.

**Regression test (CDP — `scripts/ui-fix-verification.mjs` §B-4):** for each
locale at 1280 / 960 / 375 px: the dot must sit on the **reading-start side of
the text** (RTL: `dotX > textBoxX`; LTR: `dotX < textBoxX`) and be vertically
centered in the badge (`dotCenterOff === 0`).

**Evidence:**

```
PASS  B-4 badge (fa, 1280px)  dir=rtl dotX=1176 textBoxX=997  centerOff=0
PASS  B-4 badge (fa, 960px)   dir=rtl dotX=898  textBoxX=719  centerOff=0
PASS  B-4 badge (fa, 375px)   dir=rtl dotX=328  textBoxX=149  centerOff=0
PASS  B-4 badge (en, 1280px)  dir=ltr dotX=80   textBoxX=102  centerOff=0
PASS  B-4 badge (en, 960px)   dir=ltr dotX=37   textBoxX=59   centerOff=0
PASS  B-4 badge (en, 375px)   dir=ltr dotX=37   textBoxX=59   centerOff=0
PASS  B-4 badge (ar, 1280px)  dir=rtl dotX=1176 textBoxX=1050 centerOff=0
PASS  B-4 badge (ar, 960px)   dir=rtl dotX=898  textBoxX=773  centerOff=0
PASS  B-4 badge (ar, 375px)   dir=rtl dotX=328  textBoxX=203  centerOff=0
```

### B-5 — the "راهنمایی تلفنی" phone icon on the wrong side in RTL

**Observed:** the phone icon sat on the wrong side of the text in RTL.

**Root cause (evidence):** same class as B-4 — on a clean load the icon was
already on the start side (right in RTL, left in LTR) via the same
direction-aware flex row; the reported symptom was the B-1 mixed-state render.
No source change needed; pinned by regression.

**Regression test (CDP — `scripts/ui-fix-verification.mjs` §B-5):** for each
locale at 1280 / 960 / 375 px: the icon center must be on the
**reading-start side of the anchor center** (RTL: `iconX + iconW/2 >
anchorCenter`; LTR: `<`).

**Evidence:**

```
PASS  B-5 phone icon (fa, 1280px)  dir=rtl iconX=1157 anchorCenter=1119
PASS  B-5 phone icon (fa, 960px)   dir=rtl iconX=879  anchorCenter=841
PASS  B-5 phone icon (fa, 375px)   dir=rtl iconX=309  anchorCenter=271
PASS  B-5 phone icon (en, 1280px)  dir=ltr iconX=87   anchorCenter=156
PASS  B-5 phone icon (en, 960px)   dir=ltr iconX=44   anchorCenter=113
PASS  B-5 phone icon (en, 375px)   dir=ltr iconX=44   anchorCenter=113
PASS  B-5 phone icon (ar, 1280px)  dir=rtl iconX=1157 anchorCenter=1127
PASS  B-5 phone icon (ar, 960px)   dir=rtl iconX=879  anchorCenter=850
PASS  B-5 phone icon (ar, 375px)   dir=rtl iconX=309  anchorCenter=280
```

---

## 2. B-6 — the audit of the whole in-scope surface

`scripts/ui-fix-verification.mjs` §B-6 walks **every in-scope route × every
locale**: `/`, `/services`, and all ten category pages (`gen`, `plastic`,
`ortho`, `uro`, `eye`, `ent`, `gyn`, `aes`, `anes`, `endo`) in fa/en/ar. At
1280 px it asserts `<html lang>`/`<html dir>` match the locale and no
horizontal overflow; at 375 px it asserts no horizontal overflow. 72 checks,
all passing. Beyond that, the pass re-ran the standing gates — a11y (axe) over
13 routes × 3 locales × 2 themes, the keyboard-only pass, the reduced-motion
pass, the console check, the link audit, and the canonical 320 px overflow
probe — so the audit is not "I looked around" but the same measured surface the
Phase 2 gates cover, re-run against the fixed build (§4).

No direction/alignment bug of the B-1…B-5 class was found outside the five
reported items. The one systemic defect the audit turned up was **the
a11y/correctness impact of B-1 itself**: because every locale-switch click used
to leave the document half-flipped, large parts of the surface were only
"correct" by accident of a fresh load. Fixing B-1 (document navigation) is what
made the lang/dir assertions in §B-6 meaningful at all.

B-6 evidence excerpt (72 rows total, 0 failed — full log in
`docs/reports/ui-fix-verification.log`):

```
PASS  B-6 lang/dir (fa, /services/gyn, 1280px)  lang=fa dir=rtl overflow=false
PASS  B-6 overflow (fa, /services/gyn, 375px)   scrollWidth>innerWidth=false
… (identical rows for all 12 routes × 3 locales, both widths)
PASS  B-6 lang/dir (ar, /services/endo, 1280px) lang=ar dir=rtl overflow=false
PASS  B-6 overflow (ar, /services/endo, 375px)  scrollWidth>innerWidth=false
```

---

## 3. Confirmation of scope discipline

- **No Phase 3 work.** Nothing in `docs/roadmap/PHASE_3.md` was
  started; Phase 3 remains not-approved per `CLAUDE.md` §4.
- **No new features, pages, or routes.** The route catalog is unchanged: the
  same 12 in-scope routes; `next build` reports the same 17 generated pages
  (12 routes + `/_not-found`, `/api/status`, `/robots.txt`, `/sitemap.xml`,
  `/services/[category]` shell). The only UI removal was the B-2 fake button,
  which the "no fake buttons" rule required.
- **No new dependencies.** `package.json` `dependencies` / `devDependencies`
  are byte-identical to the Phase 2 freeze, except one added **npm script
  entry** (`"ui-fix:verify": "node scripts/ui-fix-verification.mjs"`) — a
  convenience alias for the new probe, which itself uses only Node's built-in
  WebSocket and fetch, per the directive ("extend the existing CDP harness
  style … do not add a new browser-automation dependency").
- **Locale pipeline unchanged and still server-side:**
  `?lang=` → `lang` cookie (`src/middleware.ts`) → `Accept-Language` → fa.
  B-1's fix works *through* that pipeline (a real navigation), not around it.
- **Reference untouched:** 114/114 files, 0 modified (§4.6).

---

## 4. Gate results (observed, not claimed)

| # | Gate | Result |
|---|---|---|
| 4.1 | `npx tsc --noEmit` | **clean, 0 errors** |
| 4.2 | `npx vitest run` | **30 files / 226 tests, all green** (frozen subset: 29 files / 222 tests) |
| 4.3 | `npm run build` (clean, `.next` deleted first) | **success** — compiled in 12.4 s, 17/17 pages generated; `/` 5.18 kB / 134 kB First Load; shared 103 kB; middleware 34.8 kB |
| 4.4 | `npm run a11y:scan` (13 routes × 3 locales × 2 themes) | **78/78 page-runs, axe findings: serious=0 critical=0 moderate=0 minor=0** |
| 4.5 | `npm run cwv` (CWV budget audit) | **PASS — 8/8 warm page-runs in budget, 0 breaching** (worst warm: LCP 100 ms, CLS 0.000, INP 48 ms; budgets per Google Good thresholds) |
| 4.6 | Reference mtime probe (`پلتفرم/`) | **114 files, 0 modified after 2026-11-09 09:30** — unchanged |
| 4.7 | `node scripts/overflow-probe.mjs` (canonical 320 px gate) | **PASS — 36/36 measured routes, no horizontal overflow at 320 px** |
| 4.8 | `node scripts/keyboard-pass.mjs` | **PASS — 24/24 page-runs** (12 routes × 2 widths: skip-link first, full Tab coverage, visible focus ring, Enter activation, disclosure menus) |
| 4.9 | `node scripts/reduced-motion-pass.mjs` | **PASS — 24/24 page-runs** (content fully visible/static under `reduce`; motion layer armed under `no-preference`) |
| 4.10 | `node scripts/console-check.mjs` | **PASS — 12/12 routes, zero console errors / exceptions / failed or 4xx-5xx asset loads** |
| 4.11 | `node scripts/link-audit.mjs` | **PASS — anchor boundary audit over 12 routes, 0 out-of-scope anchors** |
| 4.12 | `npm run ui-fix:verify` (this pass's probe, 105 checks) | **105 checks, 0 failed, exit 0** |

Logs: `docs/reports/ui-fix-verification.log` (B-1…B-6, 105 rows),
`docs/reports/a11y-scan-uifix.log` (78 rows),
`docs/reports/cwv-audit-uifix.log`, `docs/reports/overflow-probe-uifix.log`,
`docs/reports/keyboard-pass-uifix.log`,
`docs/reports/reduced-motion-pass-uifix.log`,
`docs/reports/console-check-uifix.log`, `docs/reports/link-audit-uifix.log`.

### 4.13 Frozen-baseline refreeze (disclosed, per PHASE_2_BASELINE.md)

One **frozen** file legitimately changed: `src/components/layout/SiteHeader.test.tsx`
(4 → 5 tests). Its frozen version asserted the header **contains** `/#help`
(the reference's magnifier link) — enforcing exactly the B-2 violation. The
assertion was replaced by the stronger no-search-affordance test, and a new
file `src/components/layout/LanguageSwitcher.test.tsx` (3 tests, B-1) was
added to the freeze. Manifest refrozen 2026-11-11 to
**29 files / 222 tests** (was 28 / 218); `node scripts/baseline-freeze.mjs`
verify exits 0; the gate test is green as part of the suite. The amendment,
with the justification, is recorded in
`docs/reports/PHASE_2_BASELINE.md` §"Refreeze record". The rule the directive
set — "if a frozen test must change, refreeze explicitly and document why" —
is satisfied; no parity-critical file was touched and no assertion anywhere in
the frozen set was loosened.

---

## 5. Carry-over disclosures (not introduced by this pass)

- **fa screen-reader pass remains unobservable on this build machine** (no
  fa-capable screen reader) — the same disclosed gap as Phase 2. The axe scan
  and keyboard-only pass cover the mechanical surface in fa; the live
  announced-experience in fa is still not machine-verifiable here.
- The **stale-CSS build-cache behavior** (§B-3 process note) is a property of
  the toolchain, not of this fix. Any future change that introduces *new
  Tailwind utilities in markup only* should delete `.next` before building, or
  rely on the `menuW ≥ 236` probe check to catch it.
