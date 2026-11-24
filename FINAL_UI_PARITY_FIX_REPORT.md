# Clinic-pro Final UI Parity Fix Report

Date: 2026-11-24  
Scope: International Patients, Services navigation/listings, shared multilingual header, and related responsive/i18n consistency

## A. Executive Summary

The remaining mismatch came from three underlying problems:

1. The application still rendered an older combined Services catalog at `/services`, while the current read-only demo uses a two-path gateway that leads to separate Surgical and Medical listing pages.
2. International Patients was delivered through a Persian-only static snapshot instead of locale-aware React content, so English and Arabic could not reproduce the reference structure or direction correctly.
3. The desktop header retained reference dimensions that were too narrow for the expanded English and Arabic navigation. Its menu also collapsed too late, and its booking action had no robust small-screen relocation.

The corrective implementation now:

- renders the reference-style two-card Services gateway;
- preserves the real Surgical/Medical listing pages and real service-detail routes;
- provides complete typed Persian, English, and Arabic International Patients content;
- localizes the related Home teaser and service-group hero copy;
- gives the header a wider constrained container, a compact intermediate desktop mode, an earlier menu breakpoint, and a real booking entry inside the mobile menu;
- uses logical spacing and locale-aware counters/wrapping;
- fixes service wrapper hooks so the intended reference CSS actually applies.

No Git commit or push was created. Both protected reference trees remained untouched.

## B. International Patients Page

### Problems identified

- The route used `StaticReferencePage`, which reproduced only a Persian static snapshot.
- English and Arabic content, headings, calls to action, journey steps, FAQ text, and contact guidance were not genuinely localized.
- The hero and page sections lacked sufficient clearance from the absolute shared header.
- The image sizing, large asymmetric rounding, two-column/stacked transitions, and small-screen heights were not consistently pinned.
- Journey numbering and physical left/right spacing were unsuitable across RTL and LTR.
- Long translated buttons and body copy could exceed the intended component geometry.
- The Home-page International Patients teaser was forced to Persian with `lang="fa" dir="rtl"`.

### Root causes

- A static reference-rendering abstraction was being used for a page that now exists in the current demo as a complete multilingual public journey.
- Several rules used physical spacing or desktop-only assumptions.
- There was no locale marker for selecting Persian, decimal, or Arabic-Indic journey counters.
- The absolute header and first patient-page section did not share an explicit top-clearance contract.

### Changes implemented

- Replaced the static snapshot with `InternationalPatientsContent`.
- Added typed fa/en/ar content in `internationalPatients.ts`, preserving the reference facts and adding no services, prices, claims, hours, or doctor data.
- Implemented the complete page structure:
  - localized breadcrumb and hero;
  - admissions telephone CTA and journey anchor;
  - reference hero image and caption;
  - Surgical, Medical, and Doctors destinations;
  - five-step journey;
  - pre-travel checklist;
  - four FAQ entries;
  - address, telephone, emergency guidance, and guide link.
- Restored the reference hero geometry:
  - 425px desktop/tablet image height;
  - 300px phone image height;
  - `150px 150px 24px 24px` image radius;
  - two columns above 960px and a centered stacked image below it.
- Added first-section header clearance and responsive button wrapping.
- Converted spacing to logical properties and localized journey counters:
  - Persian counters for fa;
  - decimal counters for en;
  - Arabic-Indic counters for ar.
- Localized the Home teaser in all three languages.

### Verification

- Production-browser DOM/geometry audit: PASS at 1440, 1280, 1024, 768, 393, and 360px for fa, en, and ar.
- Visual screenshots inspected at 1280, 768, and 393px for every locale.
- Each audited page reported:
  - correct `lang` and `dir`;
  - five journey steps;
  - four FAQ items;
  - no header/content collision;
  - no clipped elements;
  - no horizontal overflow.
- Reference comparison confirmed the key hero image dimensions:
  - 547.6 × 425px at 1280;
  - 346 × 300px at 393.
- The app intentionally adds top clearance that the static demo omits, because the demo places part of its breadcrumb/hero beneath the absolute header. This prevents content overlap while retaining the reference structure, image geometry, spacing, and visual identity.

## C. Services Page and Navigation

### Previous behavior

The Home “View all services” link reached `/services`, but that destination rendered the obsolete combined category catalog. The current reference demo instead presents a dedicated Services gateway with two large selectable paths.

### Expected demo behavior

`Home → View all services → Services gateway → Surgical or Medical listing → Individual service detail`

### Root cause

- `/services` still represented an earlier reference version.
- The newer reference’s `services.html`, `surgical-services.html`, and `medical-services.html` separation had not been reflected in the App Router route hierarchy.
- Service-group refinement CSS targeted `body[data-service-group]`, while the actual data attribute could only live on a nested React page wrapper; those selectors therefore never matched.
- Individual category pages lacked the `.page-services` wrapper needed for their background/layout context.

### Changes implemented

- Rebuilt `/services` as the reference-style two-card gateway:
  - Surgical Services → `/services/surgical`;
  - Medical Services → `/services/medical`.
- Reused the reference imagery:
  - operating-room image for Surgical;
  - consultation image for Medical.
- Added localized titles, descriptions, image alternatives, actions, and admissions help copy for fa/en/ar.
- Preserved the real group listing pages:
  - Surgical: seven service categories;
  - Medical: three service categories.
- Preserved each category’s real `/services/[category]` destination.
- Added `service-group-page` and `data-service-group` to the actual wrapper and updated the CSS selectors accordingly.
- Added `page-services service-category-page` around individual category pages.
- Localized Surgical/Medical hero copy instead of forcing Persian text on English and Arabic pages.
- Updated responsive image sizing and page tests for the new hierarchy.

### Journey verification

The production-browser click audit completed this real route sequence:

1. `/` — “View all services” linked to `/services`.
2. `/services` — two gateway cards rendered; Surgical linked to `/services/surgical`.
3. `/services/surgical` — seven category cards rendered; General Surgery linked to `/services/gen`.
4. `/services/gen` — “General & Laparoscopic Surgery” rendered with five service items.

Additional browser auditing covered both Surgical and Medical group pages in fa/en/ar at desktop, tablet, and phone widths. No invalid destination, clipped card, overlap, or horizontal overflow was found.

## D. Header and Multilingual Layout

### Root causes of English and Arabic overflow

- The general 1240px content container was also constraining the header even though the translated navigation and booking label require more horizontal space.
- The full navigation remained active until 1024px, leaving an unstable 1025–1280px range.
- Brand, menu, and action groups lacked the necessary `min-width: 0` / `flex-shrink` behavior.
- The Arabic booking label is wider than its Persian and English equivalents.
- Mobile brand text, language control, search, and burger controls competed for fixed width.
- The top booking button disappeared at the phone breakpoint without an equivalent menu destination.
- The language dropdown contained debug logging and a brittle inline visibility override.

### CSS/layout changes

- Added a header-only container capped at 1440px with logical inline padding.
- Added shrink-safe brand/menu rules and made the action group non-shrinking.
- Moved the full-menu cutoff to 1180px.
- Added a compact 1181–1320px mode that proportionally tightens gaps, brand mark, nav padding, language padding, and CTA padding without arbitrary per-language offsets.
- Kept the booking CTA visible in the header at 1024 and 768px.
- At 640px and below, moved the same booking destination into the open mobile menu instead of removing the action.
- Added scrollable mobile-menu bounds for short viewports.
- Added 480px and 360px brand/action adaptations using wrapping and logical dimensions.
- Retained LTR-specific menu density only where the full desktop menu is present.
- Removed the language-switcher console log and inline display/opacity/visibility styles.

### Language verification

- Persian: RTL order, logo, menu, actions, labels, and existing visual balance preserved.
- English: LTR order verified; “Book an Appointment” remains fully inside the header.
- Arabic: RTL order and Arabic shaping verified; the wider appointment label remains fully inside the header.
- All locales: language selector, search, booking action, burger, and mobile booking destination remained reachable and unclipped.

### Viewport results

| Width | Persian | English | Arabic | Observed behavior |
|---:|:---:|:---:|:---:|---|
| 1440 | PASS | PASS | PASS | Full navigation; all groups inside the 1393px nav box |
| 1280 | PASS | PASS | PASS | Compact full navigation; no overlap or clipping |
| 1024 | PASS | PASS | PASS | Burger menu active; header booking CTA remains visible |
| 768 | PASS | PASS | PASS | Burger menu active; header booking CTA remains visible |
| 393 | PASS | PASS | PASS | Compact phone header; booking action verified in mobile menu |
| 360 | PASS | PASS | PASS | Narrow-phone brand/actions fit; booking action verified in mobile menu |

Across all 18 header combinations, the automated geometry audit returned zero outside-boundary elements, zero pairwise overlaps, and zero clipped text/icons.

## E. Additional UI Fixes

- Localized the Home International Patients teaser for fa/en/ar.
- Localized Surgical and Medical group-page leads.
- Fixed inactive wrapper selectors for service cards, detail panels, and item grids.
- Added the missing service-category page wrapper so detail backgrounds and spacing match the service system.
- Converted journey and CTA spacing to logical properties for direction-safe rendering.
- Allowed translated mobile CTA text to wrap while preserving button height and touch size.
- Added explicit focus-visible treatment for patient-page links and FAQ summaries.
- Added reduced-motion handling for service gateway card transitions.
- Updated image-pipeline and public-route regression coverage.
- Refroze the documented Phase 2 baseline at 50 files / 357 tests excluding the self-referential gate; the complete suite is 51 files / 361 tests.

## F. Testing Results

| Check | Result | Details |
|---|---|---|
| TypeScript | PASS | Final `npm.cmd run typecheck`; exit 0 |
| Automated tests | PASS | Full Vitest suite: 51 files, 361 tests passed, 0 failed; isolated SQLite test posture was removed afterward and PostgreSQL Prisma configuration restored |
| Production build | PASS | `npm.cmd run build` completed successfully |
| International Patients page | PASS | fa/en/ar browser and screenshot audit; 1440/1280/1024/768/393/360 geometry checks |
| Services navigation flow | PASS | Home → `/services` → `/services/surgical` verified by real clicks |
| Individual service navigation | PASS | `/services/surgical` → `/services/gen`; detail title and five items verified |
| Persian header | PASS | All six required widths; no outside, overlap, or clipping failures |
| English header | PASS | All six required widths; booking CTA remained inside header/menu |
| Arabic header | PASS | All six required widths; Arabic text and booking CTA remained inside header/menu |
| Responsive viewport tests | PASS | 1440, 1280, 1024, 768, 393, and 360px in all three locales |
| Horizontal overflow | PASS | No audited route exceeded its layout viewport; scrollbar-adjusted widths were expected |
| Browser console | PASS | Zero console or failed-network issues in the production-browser audit |
| `git diff --check` | PASS | Final exit 0; only informational working-tree LF→CRLF notices |

Additional final integrity gate: `node scripts/baseline-freeze.mjs` reported “baseline: intact (all frozen files present and byte-identical).”

## G. Git Integrity

- HEAD before task: `5323a4690f1555311c52fb2bf87c595276ea342e`
- HEAD after task: `5323a4690f1555311c52fb2bf87c595276ea342e`
- Commit created: **NO**
- Push performed: **NO**
- Rebase/amend/reset/history rewrite: **NO**
- Protected reference directories modified: **NO**
  - `پلتفرم/`: 114 tracked files; Git status/diff empty; mtime probe found 0 files newer than the Phase 0 baseline and latest mtime remained 2026-11-09 09:29:17.
  - `clinic-platform (4)/پلتفرم/`: 136 tracked files; Git status/diff empty.
- Temporary browser profiles, screenshots, and diagnostic files under the task-created `.tmp/` directory were removed after their results were recorded.

### Modified files

1. `FINAL_UI_PARITY_FIX_REPORT.md`
2. `docs/reports/PHASE_2_BASELINE.md`
3. `src/app/international-patients/page.test.tsx`
4. `src/app/international-patients/page.tsx`
5. `src/app/page.test.tsx`
6. `src/app/page.tsx`
7. `src/app/public-routes.test.tsx`
8. `src/app/services/[category]/page.tsx`
9. `src/app/services/page.test.tsx`
10. `src/app/services/page.tsx`
11. `src/components/layout/LanguageSwitcher.tsx`
12. `src/components/layout/SiteHeader.test.tsx`
13. `src/components/layout/SiteHeader.tsx`
14. `src/modules/publicSite/components/InternationalPatientsContent.tsx`
15. `src/modules/publicSite/content/internationalPatients.ts`
16. `src/modules/services/components/ServiceGroupLanding.tsx`
17. `src/modules/services/components/image-pipeline.test.ts`
18. `src/modules/services/content/pages.ts`
19. `src/styles/globalCss/reference.css`
20. `src/styles/referencePublic/layout-refinement.css`
21. `src/styles/referencePublic/patient-pages.css`
22. `tests/phase2-baseline.manifest.json`

### Final `git status --short`

```text
 M docs/reports/PHASE_2_BASELINE.md
 M src/app/international-patients/page.tsx
 M src/app/page.test.tsx
 M src/app/page.tsx
 M src/app/public-routes.test.tsx
 M src/app/services/[category]/page.tsx
 M src/app/services/page.test.tsx
 M src/app/services/page.tsx
 M src/components/layout/LanguageSwitcher.tsx
 M src/components/layout/SiteHeader.test.tsx
 M src/components/layout/SiteHeader.tsx
 M src/modules/services/components/ServiceGroupLanding.tsx
 M src/modules/services/components/image-pipeline.test.ts
 M src/styles/globalCss/reference.css
 M src/styles/referencePublic/layout-refinement.css
 M src/styles/referencePublic/patient-pages.css
 M tests/phase2-baseline.manifest.json
?? FINAL_UI_PARITY_FIX_REPORT.md
?? src/app/international-patients/page.test.tsx
?? src/modules/publicSite/components/InternationalPatientsContent.tsx
?? src/modules/publicSite/content/internationalPatients.ts
?? src/modules/services/content/pages.ts
```

## H. Remaining Issues

No requested implementation or verification item remains unresolved.

One deliberate difference from the static reference remains: the app gives the first breadcrumb/hero section enough top clearance to sit below the absolute header. The reference itself permits content to sit beneath that header; reproducing that collision would violate the explicit no-overlap requirement. No reference file was changed to achieve the correction.
