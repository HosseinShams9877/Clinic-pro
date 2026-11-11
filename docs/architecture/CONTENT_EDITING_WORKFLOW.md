# CONTENT_EDITING_WORKFLOW — how trilingual content is added and changed

> Phase 2 deliverable (item 1) · Architecture layer · **Persian is canonical; en and ar are siblings
> that must never drift.** This is the operator-facing contract behind
> `LOCALIZATION_AND_CALENDAR.md` §2 — read that for the *why*, this for the *how*.

---

## 1. The two content surfaces

The site has exactly two kinds of translatable content. They look different in the tree but follow
the same rule: **edit fa first, then en and ar, in the same change.**

| Surface | What it is | Where it lives | Shape |
|---|---|---|---|
| **UI messages** | Buttons, nav labels, section headings, form text, error strings — the interface chrome around the content | `src/modules/i18n/messages/{fa,en,ar}.ts` (sibling files, one key set) | flat key → string |
| **Content records** | The real catalog data: service categories, sub-services, benefits | `src/modules/*/content/*.ts` (currently `src/modules/services/content/categories.ts`) | each text field is `{ fa, en, ar }` inline |

One more typed surface exists — `src/modules/seo/content/organization.ts` — but it derives its text
from site config and the catalog; **do not type translations into it by hand**.

Nothing else may hold user-facing translated text. If a string is hardcoded into a component, that is
a defect — move it into the message catalog.

## 2. The canonical order: fa → en → ar

1. **Edit `fa` first.** fa is the source of truth. A fa string is a statement the clinic makes; the en
   and ar versions are translations *of it*.
2. **Update `en` and `ar` in the same work session.** A change merged with fa updated but en/ar stale
   is a broken build (§4 gate 1 and §4 gate 3 both fail), not a follow-up task.
3. **Never delete a key from one locale only.** Removing a message key means removing it from all
   three files.
4. **Do not invent content.** Every catalog text must trace to the reference
   (`پلتفرم/assets/js/services-data.js`, `i18n.js`, `i18n-extra.js`) with provenance recorded — see
   `docs/knowledge/CONTENT_INVENTORY.md` §7. If the reference lacks a translation for something, ask
   the owner; do not machine-generate or invent one.
5. **Digits**: write Persian text with Persian digits (۰-۹), English with 0-9, Arabic with ٠-٩. The
   render layer converts at the boundary (`src/core/i18n/digits`); storage text keeps the locale's own
   digits.

## 3. Worked example — adding a translation

Adding a UI message, e.g. a "book by phone" label:

```ts
// src/modules/i18n/messages/fa.ts
export const fa = {
  // …existing keys…
  cta: {
    // …
    bookByPhone: "رزرو تلفنی",
  },
};
```

```ts
// src/modules/i18n/messages/en.ts — same path, English
export const en = {
  cta: { bookByPhone: "Book by phone" },
};
```

```ts
// src/modules/i18n/messages/ar.ts — same path, Arabic
export const ar = {
  cta: { bookByPhone: "حجز عبر الهاتف" },
};
```

Adding a content record field (a sub-service description, say), the locale triples sit *inside* the
record — the reference's `t(fa, en, ar)` pattern, kept:

```ts
// src/modules/services/content/categories.ts
items: [
  {
    image: "/services/gen/consult.jpg",
    name: { fa: "ویزیت تخصصی", en: "Specialist visit", ar: "زيارة تخصصية" },
    description: { fa: "…", en: "…", ar: "…" },
  },
],
```

A missing `ar` (or empty string) here fails gate 2 the moment the module is imported — including at
build time.

## 4. The three gates and what they catch

| # | Gate | When it runs | What it catches | Failure signature |
|---|---|---|---|---|
| 1 | **Compile-time key completeness** — `messages = { fa, en, ar } satisfies Record<Locale, Messages>` where `type Messages = typeof fa` (`src/modules/i18n/messages/index.ts`) | `npm run typecheck`, `npm run build` (TS touches it) | a key present in fa but missing/extra in en or ar — **structurally, before any test runs** | `tsc` error: `Object literal may only specify known properties` / type mismatch |
| 2 | **Runtime schema completeness** — `LocaleTextSchema = z.object({ fa, en, ar: z.string().min(1) })`, parsed once at import (`src/modules/services/services/index.ts`) | any test, `next dev`, `next build` | a content record's text field missing a locale or left empty | `ZodError: Invalid input` at import — the page 500s in dev and the build fails |
| 3 | **Key-completeness + parity tests** — `src/modules/i18n/messages/index.test.ts`, `src/modules/services/content/categories.test.ts` | `npm test` | empty-string values; **drift from the reference itself** (declares the reference file read-only, executes it, and compares all 10 categories × all 3 locales field by field — name, description, every benefit title, every sub-service name/description, plus group/floor ordering and image paths) | vitest assertion failures naming the exact field and locale |

Gates 1 and 2 are structural: they fail the build, not just CI. Gate 3 is the parity net — it is what
makes "en/ar are translations of fa, and fa matches the reference" a checked statement rather than a
hope (Phase 2 item 3 extends its coverage; see §6).

## 5. Running the gates

```bash
npm run typecheck     # tsc --noEmit — gate 1 (and everything else)
npm run build         # next build — gates 1 + 2 execute during the build too
npm test              # vitest run — gates 1–3 plus the whole suite
npx vitest run src/modules/i18n/messages        # just the message catalog
npx vitest run src/modules/services/content     # just the catalog parity
```

The safe pre-commit minimum is `npm run typecheck && npm test`. Nothing else is needed to prove
trilingual completeness — there is no separate "i18n lint".

## 6. What changed in Phase 2 (this item)

The gates above were largely built in Phase 1. Phase 2 item 1 adds:

- **This document** — the workflow itself, which existed only as an architecture implication
  (`LOCALIZATION_AND_CALENDAR.md` §2 states the contract; nothing stated the *procedure* for a content
  editor).
- **The seed/reseed path** (item 2, `scripts/seed-content.mjs`) is now the single data-entry path for
  the catalog, and it writes these same files in this same shape — see
  `docs/reports/PHASE_2_REPORT.md` item 2. Hand-edits remain valid; the seed script is a
  regeneration-and-check tool, not a database.
- **Parity test coverage extended to all 10 categories × 3 locales at page-render level** (item 3) —
  the catalog test compared the *records*; the extension additionally asserts the rendered pages emit
  each locale's catalog text, so a locale can no longer be complete in the data file yet absent from
  the HTML.

## 7. Owner notes

- If a translation is wrong (not missing — wrong), the fix is always in all three locales if the
  underlying meaning changed, or in just the wrong one if only that translation is bad. Gate 3 will
  not catch a *bad* translation that matches the reference; the reference stays the arbiter.
- Adding a **new service category** is beyond this workflow: the reference defines ten categories and
  the implementation boundary covers them. A new category would require a reference change first.
