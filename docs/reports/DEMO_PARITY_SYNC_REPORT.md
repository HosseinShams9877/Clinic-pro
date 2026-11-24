# Demo Parity Sync Report

**Project:** Clinic-pro  
**Reference winner:** `clinic-platform (4)/پلتفرم/`  
**Date:** 2026-11-24  
**Starting and final HEAD:** `ad76625179b5727c030fea98c601b7e6aa1e2022`

## §1. Executive summary

The public site was synchronized to the changed portions of the new `clinic-platform (4)` demo. The delivered working-tree changes cover the new home composition and Crown Club, direct featured-doctor navigation, the Smart Guide, the public footer links, the demo's actual search-results experience, the “View all services” navigation, the international-patient hero image rules, and the doctor review/rating form. The reference importer and regression baseline were updated only as required by those public parity changes.

Overall status is **green within the binding public-site boundary**: TypeScript is clean, all 50 test files and 359 tests pass, the production build generates 49/49 pages, the frozen baseline verifies intact, and a rendered desktop/mobile probe passed 36/36 checks.

Two portions of the raw demo were deliberately not published because `AGENTS.md` wins over the parity prompt:

- The Smart Guide's links into the unbuilt patient account and staff/admin panels are removed at import/runtime. The public search, FAQ, insurance/cost flows, DOM, styling, and client-side demo logic remain reference-derived.
- The footer's staff/admin login strip is not added. The four-column public footer, public links, contact details, styles, and responsive behavior are retained. Adding the panel links would create forbidden dead/out-of-boundary destinations.

No unrelated phase or feature was started. No commit was made.

## §2. Area-by-area parity log

### 1. Home page (`/`)

- **New demo:** sections appear in this order: hero, statistics, help, loan, services, doctors, standards/content, international, patient steps, why-us, Crown Club, contact. Four featured doctor cards are full-card anchors to concrete profiles. Crown Club uses three stacked membership cards, four interest chips, mobile/birth-month fields, validation, a success state, and `kh-club-members` local storage.
- **Before:** the implemented page omitted Crown Club. Featured doctors without a previously imported detailed profile fell back to the directory search instead of opening the demo's direct profile destination.
- **Changed:** added the complete `#club` DOM/behavior and verbatim `cb-*` CSS; added exact crown/star/sparkle icons; made all four `.hdoc` cards direct profile anchors; added safe demo-derived profile shells for home-linked doctors whose detailed profile data is absent; retained the new demo's section order.
- **Files:** `src/app/page.tsx`, `src/components/shared/HomeClubSection.tsx`, `src/styles/globalCss/loan.css`, `src/components/shared/Icon.tsx`, `src/app/doctors/[id]/page.tsx`, `src/app/page.test.tsx`, `src/components/shared/HomeClubSection.test.tsx`, `src/app/public-routes.test.tsx`.
- **Evidence:** rendered probe at 1280×900 and 393×852 matched the demo section order, found 3 `.cb-tier` elements and 4 `input[name="topic"]` elements, found no horizontal overflow, and confirmed four direct `/doctors/[id]` targets. Invalid and valid Crown Club submissions reproduced `.bad`/`.cb-err`, `.cb-ok`, and one `kh-club-members` record. Unit tests cover both storage/validation paths.

### 2. Smart Guide (`/assistant`)

- **New demo:** `assistant.html` is a standalone patient guide with `.ast`, `#aq`, `#aRes`, insurance/cost workflows, FAQ filtering, suggested queries, result cards, empty-state escalation, modal/toast behavior, and local demo storage.
- **Before:** no public Smart Guide route existed; importer logic explicitly removed Smart Guide links and explanatory text from imported public pages.
- **Changed:** added a static Route Handler that serves a generated copy of the demo HTML; copied its exact required CSS, JS, fonts, and DOM into `public/reference/assistant/`; rewrote only app-local public destinations and asset URLs; restored public Smart Guide CTAs; added `/assistant` to routing, header navigation, sitemap, and tests. Account/panel destinations are pruned as required by `AGENTS.md`.
- **Files:** `scripts/import-public-reference.mjs`, `public/reference/assistant/**`, `src/app/assistant/route.ts`, `src/app/assistant/route.test.ts`, `src/config/site.config.ts`, `src/components/layout/SiteHeader.tsx`, `src/components/layout/SiteHeader.test.tsx`, `src/app/sitemap.ts`, `src/app/sitemap.test.ts`, `src/modules/publicSite/content/static-pages.json`, locale message files.
- **Evidence:** route tests verify the demo hooks and every required local asset. Rendered checks on the demo and live route at 1280 and 393 pixels produced the same search result shape (1 answer card, 3 matching FAQs for `بیمه`), the same 24px radius/20px padding, the same `پاسخ مستقیمی پیدا نشد` empty state and `.a-ask`, and no overflow.

### 3. Footer

- **New demo:** four-column `.footer > .container.foot-grid`, public department links, public quick links including “تور مجازی”, hours, phone, brand/social content, and responsive grid rules; the raw demo also appends staff/admin links in `.foot-bottom`.
- **Before:** the general operating-room link went to the surgical-group route and the virtual-tour quick link was absent.
- **Changed:** corrected the service link to `/services` and restored the translated “Virtual Tour” link to `/#why`. Existing reference-derived layout/styling remains in place. Staff/admin links remain omitted under the binding no-dead-link/public-boundary rule.
- **Files:** `src/components/layout/SiteFooter.tsx`, `src/modules/i18n/messages/fa.ts`, `src/modules/i18n/messages/en.ts`, `src/modules/i18n/messages/ar.ts`.
- **Evidence:** desktop/mobile rendered checks found four `.foot-grid > div` columns, the `#why` public link, and no overflow. Footer destinations are exercised by the public route/link tests.

### 4. Header search

- **New demo:** the header itself contains only `a.icon-btn[href="index.html#help"]`; it does **not** implement a typed dropdown. The new demo's typed results panel is the Smart Guide's `#aq` → `#aRes` interaction.
- **Before:** the site already used the reference header search icon/link, while the actual Smart Guide results experience did not exist.
- **Changed:** preserved the accurate header icon behavior instead of inventing a non-reference dropdown; implemented the demo's actual typed results panel at `/assistant`, including result cards, FAQ matches, close action, empty state, expert-question form, debounce, and query-string initialization.
- **Files:** `src/components/layout/SiteHeader.tsx`, `src/components/layout/SiteHeader.test.tsx`, `public/reference/assistant/index.html`, `public/reference/assistant/assets/css/assistant.css`, `public/reference/assistant/assets/js/assistant.js`, `public/reference/assistant/assets/js/assistant-data.js`.
- **Evidence:** source selector audit confirms the new header's icon-only search target and the Smart Guide's `#aq/#aRes` implementation. The 36-check rendered probe verifies matching populated and empty result states at desktop/mobile widths.

### 5. “View all services” (`مشاهده همه خدمات`)

- **New demo:** a normal anchor, `.h-more[href="services.html"]`, performs document navigation to the complete services page.
- **Before:** the destination was `/services`, but it used framework client navigation rather than the demo's ordinary anchor behavior.
- **Changed:** replaced the home services `Link` with a normal `<a href="/services">`, preserving the same classes, icon, hover styles, and rendered destination.
- **Files:** `src/app/page.tsx` and `src/app/page.test.tsx`.
- **Evidence:** rendered checks at 1280 and 393 pixels confirmed `.h-more` resolves to `/services`; route tests confirm the services catalog renders and no `.html` target leaks into the app.

### 6. International patients (`/international-patients`)

- **New demo:** `.pp-intl-hero img` is full-width, `object-fit: cover`, 425px high on desktop and 300px below 760px, with `border-radius: 150px 150px 24px 24px`; the figure is centered and capped at 460px on mobile.
- **Before:** the generated page/styles were based on the prior reference snapshot and required re-synchronization against the new package.
- **Changed:** re-imported the new reference markup and `patient-pages.css` without redesign. The final CSS is byte-identical to the corresponding new-reference rules.
- **Files:** generated `src/modules/publicSite/content/static-pages.json`; verified source copy `src/styles/referencePublic/patient-pages.css` (no final byte diff because it already matched after import).
- **Evidence:** rendered measurements: desktop image 548×425, mobile image 346×300, `object-fit: cover`, exact `150px 150px 24px 24px` radius, and no horizontal overflow at either width.

### 7. Doctor profiles (`/doctors/[id]`) — reviews/ratings

- **New demo:** `#reviews.pcard` contains a five-star `.rate` radiogroup, three-row textarea, submit button, empty-review explanation, required-rating toast, success toast, and full reset. `doctor.js` labels this as a demo with no backend and does not persist or display a newly submitted review.
- **Before:** the review tab and section were omitted.
- **Changed:** added the same DOM classes and UX in `DoctorReviews`; selecting a star turns on preceding stars; submission without a rating shows the locale-specific validation toast; valid submission shows the approval toast and clears the rating/textarea; nothing is persisted or appended, matching the demo.
- **Files:** `src/modules/publicSite/components/DoctorReviews.tsx`, `src/modules/publicSite/components/DoctorReviews.test.tsx`, `src/app/doctors/[id]/page.tsx`, `src/app/public-routes.test.tsx`.
- **Evidence:** unit tests cover required-rating validation and successful reset. Rendered QA on `/doctors/aghadoust` confirmed the Persian validation and success messages, zero selected stars after submit, cleared textarea, and zero review-related local-storage keys.

### 8. Minor parity audit

- **New demo:** exposes Smart Guide in public navigation and CTA surfaces, includes exact new icons, direct home doctor routes, and corresponding public destinations.
- **Before:** those deltas still reflected the old reference or earlier scope exclusions.
- **Changed:** applied the additional fixes itemized in §5, refreshed importer provenance to 136 source files, added public destinations to the sitemap, and refroze only the affected baseline assertions.
- **Files:** see §5 and the complete working-tree list in §7.
- **Evidence:** `git diff --check` is clean; baseline verification reports every frozen file present and byte-identical; focused parity behavior is included in the 36/36 rendered checks and the 50-file test suite.

## §3. Smart Guide implementation details

The Smart Guide is generated from `clinic-platform (4)/پلتفرم/assistant.html` by `scripts/import-public-reference.mjs` and served by `src/app/assistant/route.ts`. Its artifact root is `public/reference/assistant/`:

- `index.html` preserves `.ast`, `.a-hero`, `.a-search`, `#aq`, `#aRes`, `#aView`, `#fList`, modal, toast, insurance wizard, and FAQ DOM.
- CSS is copied from `style.css`, `doctors.css`, `guide.css`, `assistant.css`, and `vivid.css`; font files are copied from the demo package.
- Logic is copied from `main.js`, `assistant-data.js`, `assistant.js`, `i18n.js`, and `i18n-extra.js`.
- Asset and public-route URLs are rewritten to app paths. `guide.html` and `guide-item.html?id=` resolve to `/guide` and `/guide/[id]`.
- The importer removes static staff/admin links. A small postscript observes dynamically rendered content and removes `patient-panel.html` anchors, preventing the demo from creating dead account links after search/workflow rendering.
- No new medical answer logic was authored. Intent matching, FAQ matching, surgery matching, debounce, insurance/cost state, question submission, and local demo storage remain the demo's own logic.

Verification: `src/app/assistant/route.test.ts` validates the main DOM hooks, local assets, and absence of panel/admin links. Rendered comparison passed both populated and empty results at 1280×900 and 393×852 with matching result geometry and zero overflow.

## §4. Doctor reviews section

**Fields and controls:** five star buttons (`role="radiogroup"`), one textarea (`rows=3`), and one primary submit button. The surrounding section uses the demo's `#reviews`, `.pcard`, `.ph2`, `.prev`, `.prev-empty`, `.prev-form`, `.rate`, and `.ptoast` classes.

**Validation:** rating is required; text is optional, exactly as in `assets/js/doctor.js`. Missing rating produces the localized “Please choose a rating” toast. There is no invented name, email, phone, consent, or authentication field.

**Storage/display behavior:** none. A successful submission displays the demo's “published after approval” toast, resets the form and stars, and does not append a review or write local storage. This deliberately follows the demo rather than the prompt's conditional persistence wording.

**Styling source:** existing imported `doctor.css` rules from the new reference; exact star geometry is supplied by the demo's `i-star` path in `src/components/shared/Icon.tsx`.

**Verification:** two component tests plus public-route coverage; rendered check confirmed required-rating toast, successful toast, reset state, cleared textarea, and no persisted review key.

## §5. Minor parity fixes

| Location | Before | After | File(s) |
|---|---|---|---|
| Public header | Smart Guide absent from main navigation | Added localized `/assistant` item with active/current state | `src/components/layout/SiteHeader.tsx`, locale messages |
| Imported patient-information CTAs | Importer removed Smart Guide button and explanatory paragraph | Restored new-demo public CTA and copy, rewriting destination to `/assistant` | `scripts/import-public-reference.mjs`, `static-pages.json` |
| Home featured doctors | Some cards fell back to `/doctors?q=…` | All four cards link directly to `/doctors/[id]` | `src/app/page.tsx`, doctor profile page |
| Home card/service navigation | Framework client links | Normal anchors matching static-demo document navigation | `src/app/page.tsx` |
| Home icons | Required Crown Club/review icon paths unavailable | Added exact `i-crown`, `i-star`, and `i-sparkle` paths | `src/components/shared/Icon.tsx` |
| Footer general operating-room link | `/services/surgical` | `/services`, matching `services.html` | `src/components/layout/SiteFooter.tsx` |
| Footer quick links | Virtual Tour omitted | Restored translated `/#why` link | footer and locale message files |
| Public discovery | Smart Guide and three newly publishable home doctor profiles absent | Added to sitemap/static profile params | `src/app/sitemap.ts`, doctor profile page |
| Import provenance | Prior package count recorded | New-reference manifest records 136 source files | `scripts/import-public-reference.mjs`, `reference-manifest.json` |
| Regression baseline | Old assertions forbade Smart Guide, Crown Club, and reviews | Refrozen only affected assertions at 49 files/355 tests, plus 4 gate tests | baseline manifest/report and focused tests |

## §6. Missing Media Assets

The new reference package ships **0 video files**. It mentions the following video experiences but provides only posters/“coming soon” behavior or no media file. No placeholder or external URL was added.

| Page | Element | Expected path in public/ | Notes |
|---|---|---|---|
| `/doctors/taheri-nassaj` | One-minute doctor introduction | `public/video/doctors/taheri-nassaj-intro.mp4` | Reference mentions the introduction and ships a hero/poster image only. |
| `/doctors/farajipour` | One-minute doctor introduction | `public/video/doctors/farajipour-intro.mp4` | Reference mentions the introduction but ships no video. |
| `/doctors/nezam-zavareh` | One-minute doctor introduction | `public/video/doctors/nezam-zavareh-intro.mp4` | Reference mentions the introduction but ships no video. |
| `/doctors/aghadoust` | One-minute doctor introduction | `public/video/doctors/aghadoust-intro.mp4` | Reference mentions the introduction but ships no video. |
| `/guide/[id]` (12 topics) | Operation, step by step | `public/video/guide/operation-steps.mp4` | Shared pre-op video entry; only `v-doctor.jpg` exists. |
| `/guide/[id]` (12 topics) | Getting ready | `public/video/guide/getting-ready.mp4` | Shared pre-op video entry; only `v-prep.jpg` exists. |
| `/guide/[id]` (12 topics) | Inside the operating room | `public/video/guide/operating-room.mp4` | Shared pre-op video entry; only `v-or.jpg` exists. |
| `/guide/[id]` (12 topics) | Caring for yourself at home | `public/video/guide/home-care.mp4` | Shared post-op entry; no video exists. |
| `/guide/[id]` (12 topics) | Wound care | `public/video/guide/wound-care.mp4` | Shared post-op entry; no video exists. |
| `/guide/[id]` (12 topics) | Back to activity | `public/video/guide/return-to-activity.mp4` | Shared post-op entry; no video exists. |
| `/services/gen` | General/laparoscopic service introduction | `public/video/services/gen-intro.mp4` | Demo exposes “coming soon” video behavior but ships no video. |
| `/services/gyn` | Gynecology service introduction | `public/video/services/gyn-intro.mp4` | Demo exposes “coming soon” video behavior but ships no video. |
| `/services/uro` | Urology service introduction | `public/video/services/uro-intro.mp4` | Demo exposes “coming soon” video behavior but ships no video. |
| `/services/ortho` | Orthopedics service introduction | `public/video/services/ortho-intro.mp4` | Demo exposes “coming soon” video behavior but ships no video. |
| `/services/plastic` | Plastic-surgery service introduction | `public/video/services/plastic-intro.mp4` | Demo exposes “coming soon” video behavior but ships no video. |
| `/services/eye` | Eye-service introduction | `public/video/services/eye-intro.mp4` | Demo exposes “coming soon” video behavior but ships no video. |
| `/services/ent` | ENT-service introduction | `public/video/services/ent-intro.mp4` | Demo exposes “coming soon” video behavior but ships no video. |
| `/services/aes` | Beauty/laser/hair introduction | `public/video/services/aes-intro.mp4` | Demo exposes “coming soon” video behavior but ships no video. |
| `/services/endo` | Endoscopy-service introduction | `public/video/services/endo-intro.mp4` | Demo exposes “coming soon” video behavior but ships no video. |
| `/services/anes` | Anesthesia-clinic introduction | `public/video/services/anes-intro.mp4` | Demo exposes “coming soon” video behavior but ships no video. |

**Missing-media row count: 20.**

## §7. Verification results

| Gate | Exact result |
|---|---|
| `npm run typecheck` | **PASS — 0 TypeScript errors** |
| `npm test` | **PASS — 50/50 test files, 359/359 tests** |
| `npm run build` | **PASS — 49/49 static pages generated** |
| Rendered parity probe | **PASS — 36/36 desktop/mobile checks** |
| `node scripts/baseline-freeze.mjs` | **PASS — all frozen files present and byte-identical** |
| `git diff --check` | **PASS — no whitespace errors** |
| New-reference video inventory | **0 video files shipped** |
| HEAD | `ad76625179b5727c030fea98c601b7e6aa1e2022` before and after |

Final `git status --short` contains only intended application/report changes and generated Smart Guide assets. There are no entries under `پلتفرم/` or `clinic-platform (4)/` (`REFERENCE_STATUS_CLEAN`). At report-writing time, the substantive working tree consists of 20 modified tracked files plus the new Smart Guide, Crown Club, review component/tests, generated standalone assets, and this report.

Tests were run against a temporary SQLite Prisma schema as required by the test environment. The PostgreSQL production Prisma client was regenerated successfully before the final build. Temporary QA files, browser profiles, and the temporary schema were removed.

## §8. Owner-supplied items or decisions

1. Supply any of the 20 video files in §6 if those media experiences should become publishable. No substitutes were invented.
2. Decide whether a future, separately authorized scope extension should implement the patient/staff/admin panels. Until then, their Smart Guide/footer links remain intentionally pruned under `AGENTS.md`.
3. Review and approve the working-tree diff and this report. No commit has been created for the owner.

## §9. Confirmation

- **No commit was made.**
- **HEAD is unchanged:** `ad76625179b5727c030fea98c601b7e6aa1e2022`.
- **Both reference folders are untouched:** no status entries under `پلتفرم/` or `clinic-platform (4)/`.
- **All tests are green:** 50/50 files and 359/359 tests.
- **TypeScript is clean and the production build succeeds:** 49/49 generated pages.

