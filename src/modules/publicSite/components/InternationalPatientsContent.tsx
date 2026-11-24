import Image from "next/image";
import Link from "next/link";

import { ROUTES, siteConfig } from "@/config/site.config";
import type { Locale } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { internationalPatientsCopy } from "../content/internationalPatients";

export function InternationalPatientsContent({ locale }: { locale: Locale }) {
  const copy = internationalPatientsCopy[locale];

  return (
    <div className="patient-pages international-patients-page" data-content-locale={locale}>
      <section className="container pp-intro pp-intl-hero">
        <div>
          <nav className="crumbs" aria-labelledby="international-patients-breadcrumb">
            <Link href={ROUTES.home}>{t(locale, "nav.home")}</Link>
            <span>/</span>
            <b id="international-patients-breadcrumb" aria-current="page">
              {copy.pageTitle}
            </b>
          </nav>
          <h1>
            {copy.hero.title[0]}
            <br />
            {copy.hero.title[1]}
          </h1>
          <p>{copy.hero.lead}</p>
          <a className="btn btn-primary" href={`tel:${siteConfig.phone}`}>
            {copy.hero.primaryAction}
          </a>
          <a className="btn btn-line" href="#journey">
            {copy.hero.secondaryAction}
          </a>
        </div>
        <figure>
          <Image
            src="/img/building-about-hero.png"
            alt={copy.hero.imageAlt}
            width={1717}
            height={916}
            priority
            sizes="(max-width: 960px) calc(100vw - 32px), (max-width: 1240px) 44vw, 540px"
          />
          <figcaption>{copy.hero.imageCaption}</figcaption>
        </figure>
      </section>

      <section className="container pp-band">
        <h2>{copy.services.title}</h2>
        <p>{copy.services.lead}</p>
        <div className="service-switch">
          <Link href={ROUTES.servicesSurgical}>{copy.services.surgical}</Link>
          <Link href={ROUTES.servicesMedical}>{copy.services.medical}</Link>
          <Link href={ROUTES.doctors}>{copy.services.doctors}</Link>
        </div>
      </section>

      <section className="container pp-journey" id="journey">
        <header>
          <h2>{copy.journey.title}</h2>
          <p>{copy.journey.lead}</p>
        </header>
        <ol>
          {copy.journey.steps.map((step) => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container pp-check">
        <div>
          <h2>{copy.checklist.title}</h2>
          <p>{copy.checklist.body}</p>
          <Link href={ROUTES.admission} className="btn btn-line">
            {copy.checklist.admissionAction}
          </Link>
        </div>
        <div className="pp-faq">
          <h2>{copy.faq.title}</h2>
          {copy.faq.items.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="container pp-note">
        <h2>{copy.contact.title}</h2>
        <p>{copy.contact.address}</p>
        <p>
          {copy.contact.phoneLabel}{" "}
          <a href={`tel:${siteConfig.phone}`} dir="ltr">
            +98 31 5515 4000
          </a>
        </p>
        <p>{copy.contact.emergency}</p>
        <a className="btn btn-primary" href={`tel:${siteConfig.phone}`}>
          {copy.contact.callAction}
        </a>
        <Link className="btn btn-line" href={ROUTES.guide}>
          {copy.contact.guideAction}
        </Link>
      </section>
    </div>
  );
}
