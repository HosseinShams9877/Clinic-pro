/**
 * app/page.tsx — the home page.
 *
 * Server-rendered counterpart of پلتفرم/index.html, restricted to the
 * implemented scope: hero, stats, help (services card only — the reference's
 * doctor-finder search and guide card point past the boundary), services
 * bento (8 cards, with clinics.html#anesthesia retargeted to /services/anes),
 * care banner, patient-steps accordion (static; its outbound links to
 * guide.html / patient-panel.html are removed per Q4), why-us, and the
 * contact strip (tel + external map; the booking CTA is dropped).
 *
 * Loan (ln.*) and loyalty club (cb.*) are NOT reproduced anywhere (REC-7);
 * the doctors section is past the boundary. The live admissions badge ships
 * with a server-rendered initial state (core/openHours) and is hydrated by
 * the React Query island (P1-13). Stats carry data-count attributes for the
 * optional count-up enhancement (P1-12); the text is the final value, so
 * nothing depends on client script.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { ROUTES, siteConfig } from "@/config/site.config";
import { getLocale } from "@/core/i18n/getLocale";
import { t } from "@/modules/i18n/messages";
import { routeMetadata } from "@/modules/seo/lib/metadata";
import { websiteJsonLd } from "@/modules/seo/lib/structuredData";
import { Icon, type IconName } from "@/components/shared/Icon";
import { FloatingActions } from "@/components/shared/FloatingActions";
import { HeroParticles } from "@/components/shared/HeroParticles";
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

/** The four verified stats (reference index.html lines 150–155). */
const STATS: ReadonlyArray<{
  icon: IconName;
  valueKey: "st.n1" | "st.n2" | "st.n3";
  labelKey: "st.l1" | "st.l2" | "st.l3";
  /** Numeric count-up target; absent = no animation (text stays as rendered). */
  count?: number;
}> = [
  { icon: "i-building", valueKey: "st.n1", labelKey: "st.l1", count: 7 },
  { icon: "i-team", valueKey: "st.n2", labelKey: "st.l2", count: 60 },
  { icon: "i-bed", valueKey: "st.n3", labelKey: "st.l3", count: 40 },
];

/**
 * The services bento (reference .hsv c1–c8). c7 retargets the reference's
 * clinics.html#anesthesia → /services/anes (the anesthesia clinic *is* one of
 * the ten catalog categories); every other card keeps its reference target.
 */
const BENTO: ReadonlyArray<{
  href: string;
  icon: IconName;
  titleKey: "sv.1" | "sv.2" | "sv.3" | "h.s4t" | "sv.4" | "h.s6t" | "sv.7" | "sv.6";
  subKey: "h.s1" | "h.s2" | "h.s3" | "h.s4" | "h.s5" | "h.s6" | "h.s7" | "h.s8";
}> = [
  { href: "/services/eye", icon: "i-eye", titleKey: "sv.1", subKey: "h.s1" },
  { href: "/services/ent", icon: "i-ear", titleKey: "sv.2", subKey: "h.s2" },
  { href: "/services/gyn", icon: "i-women", titleKey: "sv.3", subKey: "h.s3" },
  { href: "/services/gen", icon: "i-scalpel", titleKey: "h.s4t", subKey: "h.s4" },
  { href: "/services/uro", icon: "i-kidney", titleKey: "sv.4", subKey: "h.s5" },
  { href: "/services/aes", icon: "i-laser", titleKey: "h.s6t", subKey: "h.s6" },
  { href: "/services/anes", icon: "i-steth", titleKey: "sv.7", subKey: "h.s7" },
  { href: "/services/ortho", icon: "i-bone", titleKey: "sv.6", subKey: "h.s8" },
];

/** Care banner steps (reference .hc-steps). */
const CARE_STEPS: ReadonlyArray<"h.p1" | "h.p2" | "h.p3" | "h.p4"> = ["h.p1", "h.p2", "h.p3", "h.p4"];

/**
 * Patient-steps accordion (reference .hst). Static content, links removed.
 * The reference's fourth item (h.g4 "نوبت‌دهی آنلاین") exists solely to funnel
 * into patient-panel.html?go=new — appointment booking, beyond the Phase 1
 * boundary (Q1: contact/tel only) — so it is omitted, not stubbed. Its sibling
 * h.g2 link to guide.html is likewise dropped here (body text kept).
 */
const PATIENT_STEPS: ReadonlyArray<{
  icon: IconName;
  titleKey: "h.g1" | "h.g2" | "h.g3";
  subKey: "h.g1s" | "h.g2s" | "h.g3s";
  bodyKey: "h.g1d" | "h.g2d" | "gd.1d";
}> = [
  { icon: "i-clock", titleKey: "h.g1", subKey: "h.g1s", bodyKey: "h.g1d" },
  { icon: "i-check", titleKey: "h.g2", subKey: "h.g2s", bodyKey: "h.g2d" },
  { icon: "i-clipboard", titleKey: "h.g3", subKey: "h.g3s", bodyKey: "gd.1d" },
];

/** Why-us standards (reference .h-why, six articles). */
const WHY_US: ReadonlyArray<{
  n: string;
  icon: IconName;
  titleKey: "std.1" | "std.2" | "std.3" | "hs.4" | "hs.5" | "hs.6";
  subKey: "std.1d" | "std.2d" | "std.3d" | "hs.4d" | "hs.5d" | "hs.6d";
}> = [
  { n: "01", icon: "i-shield", titleKey: "std.1", subKey: "std.1d" },
  { n: "02", icon: "i-air", titleKey: "std.2", subKey: "std.2d" },
  { n: "03", icon: "i-steril", titleKey: "std.3", subKey: "std.3d" },
  { n: "04", icon: "i-steth", titleKey: "hs.4", subKey: "hs.4d" },
  { n: "05", icon: "i-band", titleKey: "hs.5", subKey: "hs.5d" },
  { n: "06", icon: "i-building", titleKey: "hs.6", subKey: "hs.6d" },
];

export default async function HomePage() {
  const locale = await getLocale();

  return (
    <>
      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden bg-accent-strong text-on-accent">
        {/* Rising particles — decorative, reduced-motion gated, client-only
            (P1-12). Renders nothing server-side and nothing without JS. */}
        <HeroParticles />
        <div className="container grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col gap-5">
            <span className="kicker w-fit rounded-full border border-on-accent/40 px-4 py-1.5 text-[12.5px] font-semibold">
              {t(locale, "h.k")}
            </span>
            <h1 className="text-[34px] font-extrabold leading-tight md:text-[52px]">
              {t(locale, "h.t1")} <em className="not-italic font-bold text-on-accent">{t(locale, "h.t2")}</em>
            </h1>
            <p className="max-w-xl text-[15px] leading-loose on-accent">{t(locale, "h.lead")}</p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={`tel:${siteConfig.phone}`}
                className="inline-flex items-center gap-2 rounded-lg bg-on-accent px-6 py-3.5 text-[15px] font-bold text-accent-strong transition hover:opacity-90"
              >
                <Icon name="i-phone" size={20} />
                {t(locale, "h.phone")}
              </a>
            </div>

            {/* Live admissions badge — server-rendered initial state
                (core/openHours statusFor), kept current by the React Query
                island (P1-13) polling /api/status every 60 s while visible. */}
            <LiveStatus locale={locale} serverSnapshot={statusFor(new Date())} />
          </div>

          <figure className="relative">
            {/* P2 item 8: next/image — the aspect lives on the box so the
                space is reserved before load (this <img> IS the LCP element),
                and the optimizer serves AVIF/WebP at the sizes hinted below.
                Box geometry is verified equal to the raw-<img> baseline. */}
            <div className="aspect-[4/3] overflow-hidden rounded-xl shadow-2">
              <Image
                src="/img/or-hero.jpg"
                alt={t(locale, "h.k")}
                priority
                sizes="(min-width: 960px) 550px, calc(100vw - 40px)"
                fill
                className="object-cover"
              />
            </div>
          </figure>
        </div>
      </section>

      {/* ===================== STATS ===================== */}
      <section className="container" aria-label={t(locale, "sv.kicker")}>
        <ul className="-mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map(({ icon, valueKey, labelKey, count }) => (
            <li
              key={valueKey}
              data-reveal
              className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5 shadow-1"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                <Icon name={icon} size={24} />
              </span>
              <div>
                {/* data-count feeds the optional count-up island (P1-12);
                    the text is the final value, so no-JS sees the truth. */}
                <b
                  className="block text-[24px] font-extrabold text-foreground"
                  {...(count === undefined ? {} : { "data-count": count })}
                >
                  {t(locale, valueKey)}
                </b>
                <small className="text-[12.5px] text-muted">{t(locale, labelKey)}</small>
              </div>
            </li>
          ))}
          <li className="flex items-center gap-4 rounded-xl border border-border bg-primary p-5 text-on-accent shadow-1">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-on-accent/15">
              <Icon name="i-calendar" size={24} />
            </span>
            <div>
              <b className="block text-[24px] font-extrabold">{t(locale, "h.since")}</b>
              <small className="text-[12.5px] on-accent">{t(locale, "h.sinceS")}</small>
            </div>
          </li>
        </ul>
      </section>

      {/* ===================== HELP =====================
          Reference has a doctor-finder form plus three cards; only the
          services card is inside the boundary, so only it ships. */}
      <section
        id="help"
        className="section relative -mt-px overflow-hidden bg-primary-50"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: "url(/img/help-bg.jpg)" }}
          aria-hidden="true"
        />
        <div className="container relative flex flex-col items-center gap-8 py-16 text-center md:py-20">
          <div className="flex max-w-xl flex-col gap-3">
            <h2 className="text-[26px] font-extrabold text-foreground md:text-[32px]">{t(locale, "help.title")}</h2>
            <p className="text-[14px] leading-loose text-muted">{t(locale, "h.helpS")}</p>
          </div>
          <Link
            href={ROUTES.services}
            data-reveal
            className="group flex w-full max-w-md flex-col gap-2 rounded-xl border border-border bg-surface p-7 text-right shadow-1 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <Icon name="i-scalpel" size={28} />
            </span>
            <b className="pt-2 text-[18px] font-extrabold text-foreground">{t(locale, "h.c2")}</b>
            <span className="text-[13.5px] text-muted">{t(locale, "h.c2s")}</span>
            <span className="inline-flex items-center gap-1.5 pt-2 text-[13px] font-semibold text-primary">
              {t(locale, "h.see")}
              <Icon name="i-arrow" size={16} className="arr" />
            </span>
          </Link>
        </div>
      </section>

      {/* ===================== SERVICES BENTO ===================== */}
      <section id="services" className="section">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-6 pb-8">
            <div className="flex max-w-xl flex-col gap-3">
              <span className="kicker w-fit rounded-full bg-accent/10 px-4 py-1.5 text-[12.5px] font-semibold text-accent-ink">
                {t(locale, "sv.kicker")}
              </span>
              <h2 className="text-[26px] font-extrabold text-foreground md:text-[32px]">{t(locale, "h.svT")}</h2>
              <p className="text-[14px] leading-loose text-muted">{t(locale, "h.svS")}</p>
            </div>
            <Link
              href={ROUTES.services}
              className="group inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-[14px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {t(locale, "sv.all")}
              <Icon name="i-arrow" size={18} className="arr" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENTO.map(({ href, icon, titleKey, subKey }) => (
              <Link
                key={href}
                href={href}
                data-reveal
                className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 shadow-1 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary transition-colors group-hover:bg-primary group-hover:text-on-accent">
                  <Icon name={icon} size={24} />
                </span>
                <b className="text-[15.5px] font-extrabold leading-snug text-foreground">{t(locale, titleKey)}</b>
                <span className="text-[13px] leading-7 text-muted">{t(locale, subKey)}</span>
                <span className="inline-flex items-center gap-1.5 pt-1 text-[12.5px] font-semibold text-primary">
                  {t(locale, "h.see")}
                  <Icon name="i-arrow" size={15} className="arr" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CARE BANNER ===================== */}
      <section className="section">
        <div className="container">
          <div
            data-reveal
            className="grid overflow-hidden rounded-xl border border-border bg-surface shadow-1 md:grid-cols-2"
          >
            {/* P2 item 8: fill mode — the figure reserved the box before
                (h-full on the raw img) and keeps doing so now via min-h-64 /
                md:h-full, so the absolute-positioned picture cannot shift
                layout while it decodes AVIF/WebP. */}
            <figure className="relative order-1 min-h-64 w-full overflow-hidden md:order-none md:h-full">
              <Image
                src="/img/corridor-wide.jpg"
                alt=""
                sizes="(min-width: 960px) 570px, calc(100vw - 42px)"
                fill
                className="h-full w-full object-cover"
              />
            </figure>
            <div className="flex flex-col justify-center gap-5 p-8 md:p-12">
              <h2 className="text-[24px] font-extrabold text-foreground md:text-[28px]">{t(locale, "care.title")}</h2>
              <p className="text-[14px] leading-loose text-muted">{t(locale, "h.careP")}</p>
              <ol className="flex flex-wrap gap-3">
                {CARE_STEPS.map((key, index) => (
                  <li
                    key={key}
                    className="flex items-center gap-2.5 rounded-lg bg-primary-50 px-4 py-2.5"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[12.5px] font-bold text-on-accent">
                      {index + 1}
                    </span>
                    <b className="text-[13.5px] font-semibold text-foreground">{t(locale, key)}</b>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== PATIENT STEPS =====================
          Static accordion (SERVICES_SCOPE.md §4): outbound links to
          guide.html and patient-panel.html removed per Q4. */}
      <section id="steps" className="section bg-primary-50">
        <div className="container flex flex-col gap-10">
          <div className="mx-auto flex max-w-xl flex-col gap-3 text-center">
            <span className="kicker w-fit mx-auto rounded-full bg-accent/10 px-4 py-1.5 text-[12.5px] font-semibold text-accent-ink">
              {t(locale, "gd.kicker")}
            </span>
            <h2 className="text-[26px] font-extrabold text-foreground md:text-[32px]">{t(locale, "gd.title")}</h2>
            <p className="text-[14px] leading-loose text-muted">{t(locale, "gd.sub")}</p>
          </div>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            {PATIENT_STEPS.map(({ icon, titleKey, subKey, bodyKey }) => (
              <details
                key={titleKey}
                className="group rounded-xl border border-border bg-surface shadow-1 [&_p]:mt-2"
              >
                <summary className="flex cursor-pointer list-none items-center gap-4 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                    <Icon name={icon} size={22} />
                  </span>
                  <span className="flex flex-1 flex-col">
                    <b className="text-[15px] font-bold text-foreground">{t(locale, titleKey)}</b>
                    <small className="text-[12.5px] text-muted">{t(locale, subKey)}</small>
                  </span>
                  <Icon
                    name="i-chev"
                    size={18}
                    className="rotate-180 text-muted transition-transform group-open:rotate-0"
                  />
                </summary>
                <p className="border-t border-border px-5 py-4 text-[13.5px] leading-loose text-muted">
                  {t(locale, bodyKey)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== WHY US ===================== */}
      <section id="why" className="section">
        <div className="container flex flex-col gap-10">
          <div className="mx-auto flex max-w-xl flex-col gap-3 text-center">
            <span className="kicker w-fit mx-auto rounded-full bg-accent/10 px-4 py-1.5 text-[12.5px] font-semibold text-accent-ink">
              {t(locale, "hs.k")}
            </span>
            <h2 className="text-[26px] font-extrabold text-foreground md:text-[32px]">{t(locale, "hs.t")}</h2>
            <p className="text-[14px] leading-loose text-muted">{t(locale, "hs.p")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_US.map(({ n, icon, titleKey, subKey }) => (
              <article
                key={n}
                data-reveal
                className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-1"
              >
                <span
                  className="pointer-events-none absolute -top-3 left-4 select-none text-[64px] font-extrabold leading-none text-primary/5"
                  aria-hidden="true"
                >
                  {n}
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <Icon name={icon} size={24} />
                </span>
                <b className="relative text-[15.5px] font-extrabold leading-snug text-foreground">
                  {t(locale, titleKey)}
                </b>
                <p className="relative text-[13px] leading-7 text-muted">{t(locale, subKey)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CONTACT =====================
          Booking CTA (patient-panel.html) dropped; tel + external map only. */}
      <section id="contact" className="section">
        <div className="container">
          <div className="grid gap-8 rounded-xl bg-accent-strong p-8 text-on-accent md:grid-cols-2 md:p-12">
            <div className="flex flex-col gap-4">
              <h2 className="text-[24px] font-extrabold md:text-[28px]">{t(locale, "h.ctT")}</h2>
              <p className="max-w-md text-[14px] leading-loose on-accent">{t(locale, "h.ctS")}</p>
              <ul className="flex flex-col gap-3 pt-2">
                <li className="flex items-center gap-3 text-[14px] font-semibold">
                  <Icon name="i-phone" size={20} />
                  <a href={`tel:${siteConfig.phone}`} dir="ltr" className="transition hover:opacity-80">
                    {siteConfig.phoneDisplay}
                  </a>
                </li>
                <li className="flex items-center gap-3 text-[13.5px] on-accent">
                  <Icon name="i-clock" size={20} />
                  {t(locale, "ct.hours")}
                </li>
                <li className="flex items-center gap-3 text-[13.5px] on-accent">
                  <Icon name="i-pin" size={20} />
                  {t(locale, "h.addrS")}
                </li>
              </ul>
            </div>
            <div className="flex flex-col justify-center gap-3 md:items-end">
              <a
                href={siteConfig.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-lg bg-on-accent px-6 py-3.5 text-[15px] font-bold text-accent-strong transition hover:opacity-90"
              >
                <Icon name="i-pin" size={20} />
                {t(locale, "ct.map")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Floating quick actions — tel + back-to-top (reference .qa, trimmed). */}
      <FloatingActions locale={locale} />

      {/* WebSite structured data (P1-14). No SearchAction: search does not
          exist in the implemented scope, and schema must not describe
          nonexistent functionality (SEO_ACCESSIBILITY_SECURITY.md §1.3). */}
      <JsonLd document={websiteJsonLd()} />
    </>
  );
}
