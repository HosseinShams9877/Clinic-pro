/**
 * app/services/page.tsx — the Services landing page.
 *
 * Server-rendered counterpart of the reference's services.html: the sv2 hero,
 * the two group sections (#surgical / #medical) holding all ten category
 * cards, and the advisory strip. The reference loads the catalog client-side
 * from services-data.js; here the same catalog is imported server-side and
 * Zod-validated at the module boundary, so the HTML ships complete.
 *
 * Boundary compliance: the video button (sv2.vid) and the "online consult"
 * link (index.html#international) are dropped — both point outside the
 * Services section (Q1: contact/tel only). The nav crumbs, group anchors and
 * category links all resolve inside the implemented scope.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { ROUTES } from "@/config/site.config";
import { getLocale } from "@/core/i18n/getLocale";
import { t } from "@/modules/i18n/messages";
import { routeMetadata } from "@/modules/seo/lib/metadata";
import { Icon } from "@/components/shared/Icon";
import { ServiceGroupSection } from "@/modules/services/components/ServiceGroupSection";
import { siteConfig } from "@/config/site.config";

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
    <>
      {/* ---- sv2 hero ---- */}
      <section className="relative overflow-hidden bg-accent-strong text-on-accent">
        <div className="container grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col gap-5">
            <nav className="flex items-center gap-2 text-[12.5px]" aria-label="breadcrumb">
              <Link href={ROUTES.home} className="transition-opacity hover:opacity-80">
                {t(locale, "nav.home")}
              </Link>
              <span>/</span>
              <b aria-current="page">{t(locale, "nav.services")}</b>
            </nav>
            <span className="kicker w-fit rounded-full border border-on-accent/40 px-4 py-1.5 text-[12.5px] font-semibold">
              {t(locale, "sv2.k")}
            </span>
            <h1 className="text-[34px] font-extrabold leading-tight md:text-[46px]">
              {t(locale, "sv2.t1")} <em className="not-italic font-bold text-on-accent">{t(locale, "sv2.t2")}</em>
            </h1>
            <p className="max-w-xl text-[15px] leading-loose opacity-90">{t(locale, "sv2.p")}</p>
            <ul className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
              {HERO_FEATURES.map(({ key, icon }) => (
                <li key={key} className="flex items-center gap-2 text-[13.5px] font-medium">
                  <Icon name={icon} size={20} />
                  {t(locale, key)}
                </li>
              ))}
            </ul>
          </div>
          <figure className="relative">
            {/* P2 item 8: this <img> is /services's LCP element — priority +
                reserved aspect box (see app/page.tsx for the same treatment). */}
            <div className="aspect-[4/3] overflow-hidden rounded-xl shadow-2">
              <Image
                src="/img/guide/v-or.jpg"
                alt={t(locale, "nav.services")}
                priority
                sizes="(min-width: 960px) 550px, calc(100vw - 40px)"
                fill
                className="object-cover"
              />
            </div>
          </figure>
        </div>
      </section>

      {/* ---- the ten categories, in the reference's two groups ---- */}
      <div className="container flex flex-col gap-14 py-16 md:py-20">
        <ServiceGroupSection group="surg" locale={locale} />
        <ServiceGroupSection group="med" locale={locale} />
      </div>

      {/* ---- advisory strip (sask): tel-only CTA ---- */}
      <section className="container pb-20">
        <div className="grid gap-8 overflow-hidden rounded-xl bg-primary-50 p-8 md:grid-cols-[1.2fr_1fr] md:p-12">
          <div className="flex flex-col gap-4">
            <span className="kicker w-fit rounded-full bg-accent/10 px-4 py-1.5 text-[12.5px] font-semibold text-accent-ink">
              {t(locale, "sv2.askK")}
            </span>
            <h2 className="text-[24px] font-extrabold text-foreground">{t(locale, "sv2.askT")}</h2>
            <p className="max-w-md text-[14px] leading-loose text-muted">{t(locale, "sv2.askP")}</p>
            <a
              href={`tel:${siteConfig.phone}`}
              className="btn-primary mt-2 inline-flex w-fit items-center gap-2 rounded-lg bg-accent-strong px-6 py-3.5 text-[15px] font-bold text-on-accent transition hover:opacity-90"
            >
              <Icon name="i-phone" size={20} />
              {t(locale, "sv2.call")}
            </a>
          </div>
          <ul className="flex flex-col gap-4">
            {ADVISORY_ITEMS.map(({ icon, titleKey, subKey }) => (
              <li key={titleKey} className="flex items-start gap-3">
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-accent-ink shadow-1">
                  <Icon name={icon} size={18} />
                </span>
                <div>
                  <b className="block text-[14px] font-bold text-foreground">{t(locale, titleKey)}</b>
                  <small className="text-[12.5px] text-muted">{t(locale, subKey)}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
