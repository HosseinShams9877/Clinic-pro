# LOCALIZATION_AND_CALENDAR — Persian-first i18n, RTL, digits, and Solar Hijri

> Phase 0 deliverable · Architecture layer · This is the deepest divergence from the reference and the
> most spec-constrained area. **Persian is canonical; everything else derives from it.**

---

## 1. Locales

| Code | Name | Direction | Digits |
|---|---|---|---|
| `fa` (default) | فارسی | `rtl` | ۰-۹ |
| `en` | English | `ltr` | 0-9 |
| `ar` | العربية | `rtl` | ٠-٩ |

- Default `lang="fa" dir="rtl"` on `<html>` — set at request time, never only by client JS.
- Resolution: URL → cookie → `Accept-Language` → `fa`. Persisted (reference behavior: `localStorage
  kh-lang`; we use a cookie so the server sees it on first paint).
- EN/AR are **translations of the fa canonical text under the same keys** — exactly the reference's
  contract (`data-i18n` keys ↔ `window.I18N.en/ar`).

## 2. Where messages live

- `src/modules/*/content` (fa canonical) + sibling `en`/`ar` dictionaries (from `i18n.js` +
  `i18n-extra.js` — ~1 000 lines of trilingual keys to be consolidated in Phase 1).
- A **key-completeness test** must fail the build if any key is missing in en or ar — the reference
  achieves this implicitly by shipping both dictionaries keyed identically; we enforce it explicitly.
- The UI layer (buttons, nav, errors) uses a message catalog; content records (catalog, later doctors)
  carry `{ fa, en, ar }` inline (the reference's `t(fa, en, ar)` pattern, kept).

## 3. RTL-first rules

1. **Logical properties everywhere** — `ps/pe/ms/me`, `start/end`, no `left/right` in flippable CSS.
2. **Icons that imply direction** flip: `i-arrow`, `i-chev` are direction-aware; medical icons are not.
3. **Layout asymmetry is intentional** — the reference's nav starts from the right in fa and flips for
   en; verify with a visual RTL/LTR test at every breakpoint.
4. Only **one** flexbox/grid direction flip point: `dir` on `<html>`; per-component direction hacks are
   banned.
5. Numbers inside `dir="ltr"` shims stay LTR (phone `031 - 5515 4000` — the reference wraps it in
   `a.foot-phone dir="ltr"`; we keep the shim pattern, it is correct).

## 4. Digits

| Direction of travel | Rule |
|---|---|
| UI display | `toPersianDigits` (fa) / `toArabicDigits` (ar) at the **render boundary only** |
| IDs, URL params, JSON, DB, comparisons | ASCII digits **always** |
| User input of phone numbers | Persian/Arabic-Indic digits tolerated → normalized → validated `/^09\d{9}$/` (reference behavior, kept) |

NaN formatting, batch formatting of strings with mixed numbers: shared util, unit-tested (the reference
implements this twice — we implement once).

## 5. Solar Hijri calendar — the strategy

**Canonical storage is always ISO-8601 Gregorian UTC (ASCII). Jalali is a render-time concern.**

- **Store:** `Date` / ISO string. Never Jalali strings in DB, URLs, JSON, or state.
- **Convert:** through **one** module (`core/i18n/jalali`), a thin wrapper over a well-tested converter
  (`date-fns-jalali` or equivalent; the implementation is swappable behind the module boundary).
- **Render:** `formatJalali(iso, locale, { withDigits })` — digit localization applied inside, at the
  same boundary, so consumers never see a partially-formatted string.
- **Input:** any future Jalali date picker converts to ISO on change; component state stays ISO.
- **Comparison:** always on ISO. (The classic bug — comparing `۱۴۰۳/۰۸/۱۲` strings — becomes impossible.)

Phase 1 Jalali usage is limited (opened ۱۳۹۹ on about/teasers; news/dates later) — but the module and
its tests are built in Phase 1 so later phases never choose a second approach.

## 6. Fonts per locale

- All three locales render in **Vazirmatn Variable** (self-hosted, works for fa/en/ar).
- The **nastaliq** face is applied to the Persian slogan element **only when `lang="fa"`** — the
  reference's selector `html[lang="fa"] .h-copy h1.h-slogan` is the model.

## 7. Server-side rendering of locale

- The locale is resolved on the server and baked into `<html lang dir>` + the chosen messages —
  no first-paint language flash (the reference has one, because it defaults to fa then switches; with
  a cookie we can do better — the reference's `?lang=` URL param is kept as an override).
- `kh:lang` re-render behavior (reference) is replaced by React state + server round-trip for content,
  with client-side instant switch for the UI chrome.

## 8. Content rules for translators (from the reference's headers)

- Medical/insurance translation wording: the medical team and the insurance officer validate **the
  content**, not just the translation (provenance rules, `CONTENT_INVENTORY.md` §7).
- Arabic must match the reference's MSA register (the reference's ar text is formal MSA, e.g.
  «غرفة عمليات بتلوث صفري»).

## 9. Testing localization

- key-completeness across fa/en/ar (build-failing)
- digit round-trip (`toLatin(toPersianDigits(n)) === n`)
- RTL/LTR screenshot parity at all five breakpoints for `/` and `/services`
- Jalali conversion pinned against known anchor dates (e.g. ۱۳۹۹ opening ↔ 2020 Gregorian), with the
  conversion library's own tests as a lower layer, not a substitute
