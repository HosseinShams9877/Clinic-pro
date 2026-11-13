/**
 * app/page.tsx — the home page, a faithful port of پلتفرم/index.html.
 *
 * The DOM mirrors the reference section for section (hero → stats → help →
 * services → care banner → patient steps → why-us → contact strip) on the
 * reference's own class hooks, which reference.css styles 1:1. The living
 * layer is replicated by dedicated islands: `HomeSvcBento` (home-svc.js),
 * `HeroParallax` + `LiveStatus` + `FloatingActions` (home.js) and
 * `LivingEffects` (main.js — mounted in layout.tsx).
 *
 * Scope substitutions, all per the binding Q decisions (OPEN_QUESTIONS.md):
 *   - Q1: every reference `patient-panel.html?go=new` booking CTA dials the
 *     verified admissions number `tel:+983155154000` (hero CTA, patient step
 *     4, contact strip, .qa-book) — the panel is past the boundary.
 *   - Q4: the help-search form (its targets are doctors.html / guide.html),
 *     the doctors and guide cards of `.hh-cards`, the `guide.html` link in
 *     patient step 2, and the loan (ln.*) / club (cb.*) / doctors sections
 *     are not rendered at all — no stubs, no dead links.
 *   - `clinics.html#anesthesia` on card c7 retargets to the built
 *     `/services/anes`.
 *
 * fa is canonical; the hero image alt is the reference's fa literal (the
 * reference never localizes alt text).
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { ROUTES, siteConfig } from "@/config/site.config";
import { getLocale } from "@/core/i18n/getLocale";
import { toLocaleDigits } from "@/core/i18n/digits";
import { t } from "@/modules/i18n/messages";
import { routeMetadata } from "@/modules/seo/lib/metadata";
import { websiteJsonLd } from "@/modules/seo/lib/structuredData";
import { Icon, type IconName } from "@/components/shared/Icon";
import { FloatingActions } from "@/components/shared/FloatingActions";
import { HeroParallax } from "@/components/shared/HeroParallax";
import { HomeSvcBento } from "@/components/shared/HomeSvcBento";
import { JsonLd } from "@/components/shared/JsonLd";
import { LiveStatus } from "@/components/shared/LiveStatus";
import { statusFor } from "@/core/openHours";

export function generateMetadata(): Metadata {
  // Home is the canonical fa root (SEO_ACCESSIBILITY_SECURITY.md §1.2/§1.5):
  // title + description from the verified message tables, trilingual
  // alternates, and text-only OG/Twitter (no invented social image).
  return routeMetadata({
    title: t("fa", "meta.title"),
    description: t("fa", "meta.description"),
    path: ROUTES.home,
  });
}

/**
 * The four verified stats (reference index.html, `.h-stats`). The first three
 * carry `data-count` for the reference's count-up (main.js); "از سال ۱۳۹۹"
 * is static text in the reference and stays static here.
 */
const STATS: ReadonlyArray<{
  icon: IconName;
  valueKey: "st.n1" | "st.n2" | "st.n3" | "h.since";
  labelKey: "st.l1" | "st.l2" | "st.l3" | "h.sinceS";
  /** Present = the reference animates this number (main.js count-up). */
  count?: true;
}> = [
  { icon: "i-building", valueKey: "st.n1", labelKey: "st.l1", count: true },
  { icon: "i-team", valueKey: "st.n2", labelKey: "st.l2", count: true },
  { icon: "i-bed", valueKey: "st.n3", labelKey: "st.l3", count: true },
  { icon: "i-calendar", valueKey: "h.since", labelKey: "h.sinceS" },
];

/**
 * The eight static services cards (`.h-svc`), in the reference's own order
 * (c1 eye … c8 ortho). They are the shipped content — the `HomeSvcBento`
 * island swaps in the reference's tabbed bento after mount, and they remain
 * as the no-JS/SEO fallback, exactly like the reference's own degradation.
 */
const STATIC_SERVICES: ReadonlyArray<{
  cls: string;
  href: string;
  icon: IconName;
  titleKey: "sv.1" | "sv.2" | "sv.3" | "h.s4t" | "sv.4" | "h.s6t" | "sv.7" | "sv.6";
  textKey: "h.s1" | "h.s2" | "h.s3" | "h.s4" | "h.s5" | "h.s6" | "h.s7" | "h.s8";
}> = [
  { cls: "c1", href: "/services/eye", icon: "i-eye", titleKey: "sv.1", textKey: "h.s1" },
  { cls: "c2", href: "/services/ent", icon: "i-ear", titleKey: "sv.2", textKey: "h.s2" },
  { cls: "c3", href: "/services/gyn", icon: "i-women", titleKey: "sv.3", textKey: "h.s3" },
  { cls: "c4", href: "/services/gen", icon: "i-scalpel", titleKey: "h.s4t", textKey: "h.s4" },
  { cls: "c5", href: "/services/uro", icon: "i-kidney", titleKey: "sv.4", textKey: "h.s5" },
  { cls: "c6", href: "/services/aes", icon: "i-laser", titleKey: "h.s6t", textKey: "h.s6" },
  // c7: the reference's clinics.html#anesthesia → the built category page.
  { cls: "c7", href: "/services/anes", icon: "i-steth", titleKey: "sv.7", textKey: "h.s7" },
  { cls: "c8", href: "/services/ortho", icon: "i-bone", titleKey: "sv.6", textKey: "h.s8" },
];

/** The four care-banner steps (`.hc-steps`) — numerals localise per locale. */
const CARE_STEPS: ReadonlyArray<"h.p1" | "h.p2" | "h.p3" | "h.p4"> = ["h.p1", "h.p2", "h.p3", "h.p4"];

/**
 * The four patient-steps accordions (`.h-steps`), reference order. Step 4
 * (online booking) is restored: per Q1 its `patient-panel.html` link dials
 * admissions. Step 2's `guide.html` link is dropped per Q4, its body text
 * kept — the reference's own markup shape, no dead link.
 */
const PATIENT_STEPS: ReadonlyArray<{
  icon: IconName;
  titleKey: "h.g1" | "h.g2" | "h.g3" | "h.g4";
  subKey: "h.g1s" | "h.g2s" | "h.g3s" | "h.g4s";
  bodyKey: "h.g1d" | "gd.1d";
  /** Steps 2 and 4 wrap the body in a span in the reference; step 4 adds a link. */
  bodySpanKey?: "h.g2d" | "h.g4d";
  linkKey?: "h.g4a";
}> = [
  { icon: "i-clock", titleKey: "h.g1", subKey: "h.g1s", bodyKey: "h.g1d" },
  { icon: "i-check", titleKey: "h.g2", subKey: "h.g2s", bodyKey: "gd.1d", bodySpanKey: "h.g2d" },
  { icon: "i-clipboard", titleKey: "h.g3", subKey: "h.g3s", bodyKey: "gd.1d" },
  { icon: "i-calendar", titleKey: "h.g4", subKey: "h.g4s", bodyKey: "gd.1d", bodySpanKey: "h.g4d", linkKey: "h.g4a" },
];

/** The six why-us articles (`.h-why`), reference order. */
const WHY_US: ReadonlyArray<{
  n: string;
  icon: IconName;
  titleKey: "std.1" | "std.2" | "std.3" | "hs.4" | "hs.5" | "hs.6";
  textKey: "std.1d" | "std.2d" | "std.3d" | "hs.4d" | "hs.5d" | "hs.6d";
}> = [
  { n: "01", icon: "i-shield", titleKey: "std.1", textKey: "std.1d" },
  { n: "02", icon: "i-air", titleKey: "std.2", textKey: "std.2d" },
  { n: "03", icon: "i-steril", titleKey: "std.3", textKey: "std.3d" },
  { n: "04", icon: "i-steth", titleKey: "hs.4", textKey: "hs.4d" },
  { n: "05", icon: "i-band", titleKey: "hs.5", textKey: "hs.5d" },
  { n: "06", icon: "i-building", titleKey: "hs.6", textKey: "hs.6d" },
];

export default async function HomePage() {
  const locale = await getLocale();

  return (
    // `.page-home` is the reference's body hook: `body:has(.page-home)`
    // paints the light home background (reference.css).
    <div className="page-home">
      {/* home.js hero parallax — null-rendering, gated on width + motion. */}
      <HeroParallax />

      {/* ===================== HERO ===================== */}
      <section className="h-hero">
        <div className="container h-hero-in">
          <div className="h-copy">
            <span className="h-k">{t(locale, "h.k")}</span>
            <h1 className="h-slogan">
              <span>{t(locale, "h.t1")}</span>
              <em>{t(locale, "h.t2")}</em>
            </h1>
            <p className="h-lead">{t(locale, "h.lead")}</p>
            <div className="h-cta">
              {/* Q1: the booking CTA dials admissions (panel past boundary). */}
              <a className="btn btn-primary" href={`tel:${siteConfig.phone}`}>
                <Icon name="i-calendar" />
                <span>{t(locale, "cta.request")}</span>
              </a>
              <a className="btn btn-line" href={`tel:${siteConfig.phone}`}>
                <Icon name="i-phone" />
                <span>{t(locale, "h.phone")}</span>
              </a>
            </div>
          </div>
          <div className="h-media">
            <div className="h-img">
              <Image
                src="/img/or-hero.jpg"
                // The reference's fa literal — the reference never localizes alt.
                alt="اتاق عمل مرکز جراحی دکتر خیرخواه"
                fill
                priority
                // Below 960 the reference hero is full-bleed: .container has
                // padding-inline:20px (style.css L56) and .h-media pulls back
                // out with margin-inline:-20px (home.css L156), so the image
                // spans exactly 100vw. This is also why the value is NOT the
                // 116vw over-approximation this shipped with: in Chrome 156 a
                // sizes entry whose media matches at exactly 960px AND whose
                // resolved size selects the w=1200 srcset candidate never
                // issues the request, so the hero photo silently never
                // appeared at a 960px viewport and window.load never fired
                // (scripts/cwv-audit / ui-fix-verification stall). 100vw
                // selects w=1080 there and loads at every width. Desktop half
                // of the grid: 52vw.
                sizes="(max-width: 960px) 100vw, 52vw"
              />
            </div>
            {/* Live admissions badge: server-rendered initial state
                (core/openHours statusFor), kept current by the React Query
                island (P1-13) polling /api/status while the tab is visible. */}
            <LiveStatus locale={locale} serverSnapshot={statusFor(new Date())} />
          </div>
        </div>
      </section>

      {/* ===================== STATS ===================== */}
      <section className="container h-stats-wrap">
        <ul className="h-stats">
          {STATS.map((stat) => (
            <li key={stat.valueKey}>
              <span className="hs-i">
                <Icon name={stat.icon} />
              </span>
              <div>
                {/* `data-count` flags the reference's count-up (main.js); the
                    rendered text is the final localized value, so nothing
                    depends on client script. */}
                <b {...(stat.count ? { "data-count": "" } : {})}>{t(locale, stat.valueKey)}</b>
                <small>{t(locale, stat.labelKey)}</small>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ===================== HELP ===================== */}
      <section className="container h-sec" id="help">
        <div className="h-help">
          <div className="hh-t">
            <h2>{t(locale, "help.title")}</h2>
            <p>{t(locale, "h.helpS")}</p>
            {/* Q4: the reference's help-search form targets out-of-scope
                pages (doctors.html / guide.html) — not rendered. */}
          </div>
          <div className="hh-cards">
            {/* Q4: of the reference's three cards only the services card
                points into the built site; the others are not rendered. */}
            <Link className="hh-c" href={ROUTES.services}>
              <span>
                <Icon name="i-scalpel" />
              </span>
              <b>{t(locale, "h.c2")}</b>
              <small>{t(locale, "h.c2s")}</small>
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== SERVICES ===================== */}
      <section className="container h-sec" id="services">
        <div className="h-head">
          <div>
            <span className="h-kick">{t(locale, "sv.kicker")}</span>
            <h2>{t(locale, "h.svT")}</h2>
            <p>{t(locale, "h.svS")}</p>
          </div>
          <Link className="h-more" href={ROUTES.services}>
            <span>{t(locale, "sv.all")}</span>
            <Icon name="i-arrow" className="arr" />
          </Link>
        </div>
        {/* home-svc.js: after mount the tabs + bento grid replace the static
            grid below; without JS the eight cards are the shipped content. */}
        <HomeSvcBento locale={locale} />
        <div className="h-svc">
          {STATIC_SERVICES.map((card) => (
            <Link key={card.cls} className={`hsv ${card.cls}`} href={card.href}>
              <span className="hsv-i">
                <Icon name={card.icon} />
              </span>
              <b>{t(locale, card.titleKey)}</b>
              <p>{t(locale, card.textKey)}</p>
              <i>{t(locale, "h.see")}</i>
            </Link>
          ))}
        </div>
      </section>

      {/* ===================== CARE BANNER ===================== */}
      <section className="container h-sec">
        <div className="h-care">
          <div className="hc-img">
            <Image src="/img/corridor-wide.jpg" alt="" fill sizes="(max-width: 960px) 100vw, 42vw" />
          </div>
          <div className="hc-t">
            <h2>{t(locale, "care.title")}</h2>
            <p>{t(locale, "h.careP")}</p>
            <ol className="hc-steps">
              {CARE_STEPS.map((stepKey, i) => (
                <li key={stepKey}>
                  <span>{toLocaleDigits(locale, i + 1)}</span>
                  <b>{t(locale, stepKey)}</b>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ===================== PATIENT STEPS ===================== */}
      <section className="container h-sec" id="steps">
        <div className="h-head center">
          <div>
            <span className="h-kick">{t(locale, "gd.kicker")}</span>
            <h2>{t(locale, "gd.title")}</h2>
            <p>{t(locale, "gd.sub")}</p>
          </div>
        </div>
        <div className="h-steps">
          {PATIENT_STEPS.map((step) => (
            <details key={step.titleKey} className="hst">
              <summary>
                <span className="hst-i">
                  <Icon name={step.icon} />
                </span>
                <b>{t(locale, step.titleKey)}</b>
                <small>{t(locale, step.subKey)}</small>
              </summary>
              <p>
                {step.bodySpanKey ? <span>{t(locale, step.bodySpanKey)}</span> : t(locale, step.bodyKey)}
                {step.linkKey && (
                  <>
                    {" "}
                    {/* Q1: the reference's patient-panel booking link dials
                        admissions — same affordance, no out-of-scope page. */}
                    <a href={`tel:${siteConfig.phone}`}>{t(locale, step.linkKey)}</a>
                  </>
                )}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ===================== WHY US ===================== */}
      <section className="container h-sec" id="why">
        <div className="h-head center">
          <div>
            <span className="h-kick">{t(locale, "hs.k")}</span>
            <h2>{t(locale, "hs.t")}</h2>
            <p>{t(locale, "hs.p")}</p>
          </div>
        </div>
        <div className="h-why">
          {WHY_US.map((item) => (
            <article key={item.n}>
              {/* The reference's literal Latin numerals 01–06 (.hw-n). The
                  glyph is painted via ::before content (reference.css) so the
                  numeral stays purely decorative — axe has no text node to
                  flag, and the painted pixels are unchanged (R-6 fix, see
                  EXACT_VISUAL_AND_UI_FIDELITY_REPORT.md §2/B-7). */}
              <span className="hw-n" data-n={item.n} aria-hidden="true" />
              <Icon name={item.icon} />
              <b>{t(locale, item.titleKey)}</b>
              <p>{t(locale, item.textKey)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ===================== CONTACT STRIP ===================== */}
      <section className="container h-sec" id="contact">
        <div className="h-contact">
          <div className="hct-t">
            <h2>{t(locale, "h.ctT")}</h2>
            <p>{t(locale, "h.ctS")}</p>
          </div>
          <ul>
            <li>
              <Icon name="i-phone" />
              <a href={`tel:${siteConfig.phone}`} dir="ltr">
                {siteConfig.phoneDisplay}
              </a>
            </li>
            <li>
              <Icon name="i-clock" />
              <span>{t(locale, "ct.hours")}</span>
            </li>
            <li>
              <Icon name="i-pin" />
              <span>{t(locale, "h.addrS")}</span>
            </li>
          </ul>
          <div className="hct-b">
            {/* Q1: the booking CTA dials admissions (panel past boundary). */}
            <a className="btn btn-primary" href={`tel:${siteConfig.phone}`}>
              <Icon name="i-calendar" />
              <span>{t(locale, "cta.request")}</span>
            </a>
            <a className="btn btn-line" href={siteConfig.mapsUrl} target="_blank" rel="noopener">
              <Icon name="i-pin" />
              <span>{t(locale, "ct.map")}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Floating quick actions (.qa) — call, book (Q1: tel), back-to-top. */}
      <FloatingActions locale={locale} />

      {/* WebSite structured data (P1-14). No SearchAction: search does not
          exist in the implemented scope, and schema must not describe
          nonexistent functionality (SEO_ACCESSIBILITY_SECURITY.md §1.3). */}
      <JsonLd document={websiteJsonLd()} />
    </div>
  );
}
