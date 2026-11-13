/**
 * app/services/page.tsx — the Services landing page.
 *
 * The B-3 fidelity port: a section-for-section transcription of the
 * reference's services.html (پلتفرم/services.html lines 103–177) onto the
 * reference's own class hooks, with all geometry, decoration and motion
 * supplied by the ported `reference.css` (services.css/doctors.css rules).
 *
 *   <main>                          (app layout — children render in <main>)
 *   <div class="page-services">     the reference's <body class="page-services">
 *     section.shero  > .container.shero-grid > .shero-in + figure.sh-vis
 *     section.container.scats-wrap > .sgrp#surgical + .sgrp#medical
 *     section.container > .sask > .sask-t + ul.sask-l + .sask-img
 *
 * Boundary compliance (Q1/Q4): the reference's second sask button
 * (index.html#international, sv2.online) is dropped — it points outside the
 * implemented scope — and the sask CTA is the verified clinic tel: number,
 * exactly like the reference's own `tel:+983155154000`. The reference's
 * `.scat` tiles are client-side tab buttons driving a same-page detail
 * panel; here each tile is a real link to the category's own route (the
 * detail panel lives on `/services/[category]`, B-4), so no tab semantics
 * are shipped.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { ROUTES, siteConfig } from "@/config/site.config";
import { getLocale } from "@/core/i18n/getLocale";
import { t } from "@/modules/i18n/messages";
import { routeMetadata } from "@/modules/seo/lib/metadata";
import { Icon } from "@/components/shared/Icon";
import { ServiceGroupSection } from "@/modules/services/components/ServiceGroupSection";

export function generateMetadata(): Metadata {
  return routeMetadata({
    title: t("fa", "meta.services"),
    description: t("fa", "meta.servicesDescription"),
    path: ROUTES.services,
  });
}

const HERO_FEATURES: ReadonlyArray<{ key: "sv2.f1" | "sv2.f2" | "sv2.f3"; icon: "i-team" | "i-steril" | "i-shield" }> = [
  { key: "sv2.f1", icon: "i-team" },
  { key: "sv2.f2", icon: "i-steril" },
  { key: "sv2.f3", icon: "i-shield" },
];

const ADVISORY_ITEMS: ReadonlyArray<{
  icon: "i-clock" | "i-clipboard" | "i-calendar";
  titleKey: "sv2.a1" | "sv2.a2" | "sv2.a3";
  subKey: "sv2.a1s" | "sv2.a2s" | "sv2.a3s";
}> = [
  { icon: "i-clock", titleKey: "sv2.a1", subKey: "sv2.a1s" },
  { icon: "i-clipboard", titleKey: "sv2.a2", subKey: "sv2.a2s" },
  { icon: "i-calendar", titleKey: "sv2.a3", subKey: "sv2.a3s" },
];

export default async function ServicesPage() {
  const locale = await getLocale();

  return (
    <div className="page-services">
      {/* ---- shero (services.html L104–122) ---- */}
      <section className="shero">
        <div className="container shero-grid">
          <div className="shero-in">
            <nav className="crumbs" aria-label="breadcrumb">
              <Link href={ROUTES.home}>{t(locale, "nav.home")}</Link>
              <span>/</span>
              <b aria-current="page">{t(locale, "nav.services")}</b>
            </nav>
            <span className="sh-k">{t(locale, "sv2.k")}</span>
            <h1>
              <span>{t(locale, "sv2.t1")}</span>
              <em>{t(locale, "sv2.t2")}</em>
            </h1>
            <p>{t(locale, "sv2.p")}</p>
            <ul className="sh-f">
              {HERO_FEATURES.map(({ key, icon }) => (
                <li key={key}>
                  <Icon name={icon} />
                  <span>{t(locale, key)}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* The reference ships the figure with ONLY .sh-photo — no .sh-frame,
              no .float chips (services.html L117–120) — so the port does too. */}
          <figure className="sh-vis">
            {/* P2 item 8: this is /services's LCP element — priority + a
                `fill` picture inside the reference's own .sh-photo box
                (position:relative + aspect-ratio:4/3 in reference.css), so
                decoded AVIF cannot shift layout. Decorative, as in the
                reference (alt=""). */}
            <div className="sh-photo">
              <Image
                src="/img/guide/v-or.jpg"
                alt=""
                fill
                priority
                sizes="(min-width: 961px) 440px, calc(100vw - 40px)"
              />
            </div>
          </figure>
        </div>
      </section>

      {/* ---- the ten categories, in the reference's two groups (L124–133) ---- */}
      <section className="container scats-wrap">
        <ServiceGroupSection group="surg" locale={locale} />
        <ServiceGroupSection group="med" locale={locale} />
      </section>

      {/* ---- sask, the advisory strip (L159–177) ---- */}
      <section className="container">
        <div className="sask">
          <div className="sask-t">
            <span className="kicker">{t(locale, "sv2.askK")}</span>
            <h2>{t(locale, "sv2.askT")}</h2>
            <p>{t(locale, "sv2.askP")}</p>
            <div className="sask-b">
              {/* Q1: the reference's own tel: CTA is the primary action. The
                  reference's second button (sv2.online → index.html#international)
                  is dropped — no in-scope destination exists (Q4). */}
              <a className="btn btn-primary" href={`tel:${siteConfig.phone}`}>
                <Icon name="i-phone" />
                <span>{t(locale, "sv2.call")}</span>
              </a>
            </div>
          </div>
          <ul className="sask-l">
            {ADVISORY_ITEMS.map(({ icon, titleKey, subKey }) => (
              <li key={titleKey}>
                <Icon name={icon} />
                <div>
                  <b>{t(locale, titleKey)}</b>
                  <small>{t(locale, subKey)}</small>
                </div>
              </li>
            ))}
          </ul>
          {/* .sask-img is NOT positioned in the reference, so a `fill` picture
              (absolute, inset 0) would collapse against the initial containing
              box — the picture ships non-fill with the source's true intrinsic
              size (1200×422), which the ported `.sask-img img` rules override,
              exactly like the reference's own static <img>. */}
          <div className="sask-img">
            <Image
              src="/img/services/or.jpg"
              alt=""
              width={1200}
              height={422}
              loading="lazy"
              sizes="(min-width: 1181px) 340px, (min-width: 641px) calc((100vw - 136px) / 2), calc(100vw - 72px)"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
