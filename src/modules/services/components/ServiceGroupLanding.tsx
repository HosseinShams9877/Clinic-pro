import Image from "next/image";
import Link from "next/link";

import { Icon, type IconName } from "@/components/shared/Icon";
import { siteConfig } from "@/config/site.config";
import type { Locale } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { servicesPageCopy } from "@/modules/services/content/pages";
import { getLocalizedCategoriesByGroup } from "@/modules/services/services";
import type { ServiceGroup } from "@/modules/services/types";
import { ServiceGroupSection } from "./ServiceGroupSection";
import { SubServiceGrid } from "./SubServiceGrid";

const ADVISORY_ITEMS = [
  { icon: "i-clock", title: "sv2.a1", sub: "sv2.a1s" },
  { icon: "i-clipboard", title: "sv2.a2", sub: "sv2.a2s" },
  { icon: "i-calendar", title: "sv2.a3", sub: "sv2.a3s" },
] as const;

export function ServiceGroupLanding({ group, locale }: { group: ServiceGroup; locale: Locale }) {
  const copy = servicesPageCopy[locale].groups;
  const title = t(locale, group === "surg" ? "sg.surg" : "sg.med");
  const lead = group === "surg" ? copy.surgicalLead : copy.medicalLead;
  const categories = getLocalizedCategoriesByGroup(group, locale);
  const featured = categories[0];
  if (!featured) return null;

  return (
    <div className="page-doctors page-services service-group-page" data-service-group={group}>
      <section className="shero">
        <div className="container shero-grid">
          <div className="shero-in">
            <nav className="crumbs" aria-labelledby="service-group-breadcrumb-label">
              <Link href="/">{t(locale, "nav.home")}</Link>
              <span>/</span>
              <Link href="/services">{t(locale, "nav.services")}</Link>
              <span>/</span>
              <b id="service-group-breadcrumb-label" aria-current="page">{title}</b>
            </nav>
            <span className="sh-k">{t(locale, "sv2.k")}</span>
            <h1>{title}</h1>
            <p>{lead}</p>
            <div className="service-switch">
              <Link href="/services/surgical" aria-current={group === "surg" ? "page" : undefined}>
                {t(locale, "nav.svcSurg")}
              </Link>
              <Link href="/services/medical" aria-current={group === "med" ? "page" : undefined}>
                {t(locale, "nav.svcMed")}
              </Link>
            </div>
          </div>
          <figure className="sh-vis">
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

      <section className="container scats-wrap">
        <ServiceGroupSection group={group} locale={locale} />
      </section>

      <section className="container sdetail" id="sDetail">
        <div className="sd-text">
          <nav className="crumbs sd-crumb" aria-labelledby="service-detail-breadcrumb-label">
            <span>{t(locale, "nav.services")}</span>
            <span>/</span>
            <b id="service-detail-breadcrumb-label">{featured.name}</b>
          </nav>
          <h2>{featured.name}</h2>
          <p>{featured.description}</p>
          <ul className="sd-ben">
            {featured.benefits.map((benefit) => (
              <li key={benefit.title}>
                <Icon name={benefit.icon as IconName} />
                <span>{benefit.title}</span>
              </li>
            ))}
          </ul>
          <div className="sd-cta">
            <a className="btn btn-primary" href={`tel:${siteConfig.phone}`}>
              <Icon name="i-calendar" />
              <span>{t(locale, "sv2.book")}</span>
            </a>
            <Link className="btn btn-line" href={`/doctors?cat=${featured.id}`}>
              <Icon name="i-team" />
              <span>{t(locale, "sv2.docs")}</span>
            </Link>
          </div>
        </div>
        <div className="sd-video" aria-hidden="true">
          <Image src={featured.image} alt="" fill sizes="(min-width: 961px) 42vw, calc(100vw - 40px)" />
          <span className="sdv-floor">{featured.floorLabel}</span>
        </div>
      </section>

      <SubServiceGrid category={featured} locale={locale} />

      <section className="container">
        <div className="sask">
          <div className="sask-t">
            <span className="kicker">{t(locale, "sv2.askK")}</span>
            <h2>{t(locale, "sv2.askT")}</h2>
            <p>{t(locale, "sv2.askP")}</p>
            <div className="sask-b">
              <a className="btn btn-primary" href={`tel:${siteConfig.phone}`}>
                <Icon name="i-phone" />
                <span>{t(locale, "sv2.call")}</span>
              </a>
              <Link className="btn btn-line" href="/international-patients">
                <Icon name="i-chat" />
                <span>{t(locale, "sv2.online")}</span>
              </Link>
            </div>
          </div>
          <ul className="sask-l">
            {ADVISORY_ITEMS.map((item) => (
              <li key={item.title}>
                <Icon name={item.icon} />
                <div>
                  <b>{t(locale, item.title)}</b>
                  <small>{t(locale, item.sub)}</small>
                </div>
              </li>
            ))}
          </ul>
          <div className="sask-img">
            <Image src="/img/services/or.jpg" alt="" width={1200} height={422} loading="lazy" />
          </div>
        </div>
      </section>
    </div>
  );
}
