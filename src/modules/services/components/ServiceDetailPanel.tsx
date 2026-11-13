/**
 * ServiceDetailPanel.tsx — the header block of /services/[category]
 * (the reference's `section.sdetail`, services.html lines 135–152, filled by
 * services.js render()).
 *
 * The B-4 fidelity port: a section-for-section transcription onto the
 * reference's own DOM —
 *
 *   <section class="container sdetail" id="sDetail">
 *     <div class="sd-text">
 *       <nav class="crumbs sd-crumb">…</nav>
 *       <h2 id="sdName">                     → h1 here (see below)
 *       <p id="sdDesc">
 *       <ul class="sd-ben" id="sdBen">       li[svg, span] per benefit
 *       <div class="sd-cta">                 a.btn.btn-primary
 *     <button class="sd-video" id="sdVideo"> (ServiceVideoButton island)
 *
 * Two deliberate divergences from the reference's same-page panel, both
 * consequences of the app's route-based model and recorded in the fidelity
 * report:
 *   1. The category name renders as an h1, not the reference's h2 — the
 *      reference's panel shares its page with the landing's own h1, while
 *      this route's level-one heading must be the category itself. The ported
 *      `.sd-text h2` typography rule was extended to `.sd-text h1` so the
 *      rendered geometry is identical.
 *   2. The breadcrumb carries a home entry (the reference's sd-crumb starts at
 *      "services" because the tiles are in view); on a standalone route the
 *      three-step path is the app's own Phase 1 contract, pinned by the
 *      frozen detail-page test.
 *
 * CTA substitution (Q1/Q4): the reference's booking button points at
 * patient-panel.html?go=new and its "doctors of this field" button at
 * doctors.html — both are past the Services section, so the booking action is
 * retargeted to the verified clinic tel: number (the reference's own primary
 * action elsewhere on the page) and the doctors button is dropped rather than
 * given a dead destination.
 */

import Link from "next/link";

import { ROUTES, siteConfig } from "@/config/site.config";
import type { Locale } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { Icon, type IconName } from "@/components/shared/Icon";
import type { LocalizedCategory } from "@/modules/services/services";
import { ServiceVideoButton } from "./ServiceVideoButton";

export function ServiceDetailPanel({
  category,
  locale,
}: {
  category: LocalizedCategory;
  locale: Locale;
}) {
  return (
    <section className="container sdetail" id="sDetail">
      <div className="sd-text">
        <nav className="crumbs sd-crumb" aria-label="breadcrumb">
          <Link href={ROUTES.home}>{t(locale, "nav.home")}</Link>
          <span>/</span>
          <Link href={ROUTES.services}>{t(locale, "nav.services")}</Link>
          <span>/</span>
          <b aria-current="page">{category.name}</b>
        </nav>
        <h1 id="sdName">{category.name}</h1>
        <p id="sdDesc">{category.description}</p>
        <ul className="sd-ben" id="sdBen">
          {category.benefits.map((benefit) => (
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
        </div>
      </div>
      <ServiceVideoButton category={category} locale={locale} />
    </section>
  );
}
