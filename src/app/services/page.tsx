import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ROUTES, siteConfig } from "@/config/site.config";
import { getLocale } from "@/core/i18n/getLocale";
import { t } from "@/modules/i18n/messages";
import { routeMetadata } from "@/modules/seo/lib/metadata";
import { servicesPageCopy } from "@/modules/services/content/pages";

export function generateMetadata(): Metadata {
  return routeMetadata({
    title: servicesPageCopy.fa.gateway.pageTitle,
    description: servicesPageCopy.fa.gateway.lead,
    path: ROUTES.services,
  });
}

export default async function ServicesPage() {
  const locale = await getLocale();
  const copy = servicesPageCopy[locale].gateway;

  return (
    <div className="page-services patient-pages services-gateway-page" data-content-locale={locale}>
      <section className="container pp-intro">
        <nav className="crumbs" aria-labelledby="services-breadcrumb">
          <Link href={ROUTES.home}>{t(locale, "nav.home")}</Link>
          <span>/</span>
          <b id="services-breadcrumb" aria-current="page">
            {copy.pageTitle}
          </b>
        </nav>
        <h1>{copy.title}</h1>
        <p>{copy.lead}</p>
      </section>

      <section className="container pp-paths" aria-label={copy.pathsLabel}>
        <Link className="pp-path" href={ROUTES.servicesSurgical}>
          <Image
            src="/img/services/or.jpg"
            alt={copy.surgical.imageAlt}
            width={1200}
            height={422}
            priority
            sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1240px) calc(50vw - 42px), 582px"
          />
          <div>
            <h2>{copy.surgical.title}</h2>
            <p>{copy.surgical.description}</p>
            <strong>{copy.surgical.action}</strong>
          </div>
        </Link>
        <Link className="pp-path" href={ROUTES.servicesMedical}>
          <Image
            src="/img/guide/v-doctor.jpg"
            alt={copy.medical.imageAlt}
            width={1400}
            height={1050}
            priority
            sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1240px) calc(50vw - 42px), 582px"
          />
          <div>
            <h2>{copy.medical.title}</h2>
            <p>{copy.medical.description}</p>
            <strong>{copy.medical.action}</strong>
          </div>
        </Link>
      </section>

      <section className="container pp-note">
        <h2>{copy.helpTitle}</h2>
        <p>{copy.helpLead}</p>
        <a className="btn btn-primary" href={`tel:${siteConfig.phone}`}>
          {copy.callAction}
        </a>
      </section>
    </div>
  );
}
