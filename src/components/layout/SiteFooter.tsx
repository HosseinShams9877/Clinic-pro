import Link from "next/link";

import { ROUTES, siteConfig } from "@/config/site.config";
import { type Locale } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { Icon, LogoMark } from "@/components/shared/Icon";

/**
 * SiteFooter — the reference footer DOM (پلتفرم/index.html footer) hooked to
 * the fidelity port: `.footer > .container.foot-grid` (brand, departments,
 * hours) + `.container.foot-bottom`.
 *
 * Scope pruning (SERVICES_SCOPE.md §4): the reference's departments column
 * lists six clinics, of which only two labels are in scope; the quick-links
 * column is entirely out of scope and dropped. The ported grid therefore
 * spans three columns (1.5fr 1fr 1fr) instead of the reference's four — same
 * proportions, no invented content, no dead links.
 *
 * The section headings are `<h2>` (not the reference's `<h4>`) so no heading
 * level is ever skipped on any route (P2 a11y item 10); the ported
 * `.footer h4` rule therefore also matches `.footer h2` (reference.css note
 * on that rule).
 */
export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="footer">
      <div className="container foot-grid">
        <div className="foot-brand">
          <Link className="brand light" href={ROUTES.home}>
            <span className="brand-mark">
              <LogoMark size={32} />
            </span>
            <span className="brand-text">
              <small>{t(locale, "brand.small")}</small>
              <strong>{t(locale, "brand.name")}</strong>
            </span>
          </Link>
          <p>{t(locale, "ft.p")}</p>
          <a
            className="social"
            href="https://instagram.com"
            aria-label="Instagram"
          >
            <Icon name="i-insta" size={20} />
          </a>
        </div>

        <div>
          <h2>{t(locale, "ft.h1")}</h2>
          <ul>
            <li>
              <Link href={`${ROUTES.about}#history`}>{t(locale, "ft.l1")}</Link>
            </li>
            <li>
              <Link href={`${ROUTES.clinics}#anesthesia`}>
                {t(locale, "ft.l2")}
              </Link>
            </li>
            <li>
              <Link href={ROUTES.services}>{t(locale, "ft.l3")}</Link>
            </li>
            <li>
              <Link href={`${ROUTES.clinics}#hair`}>{t(locale, "ft.l4")}</Link>
            </li>
            <li>
              <Link href={`${ROUTES.clinics}#laser`}>{t(locale, "ft.l5")}</Link>
            </li>
            <li>
              <Link href={`${ROUTES.clinics}#beauty`}>{t(locale, "ft.l6")}</Link>
            </li>
          </ul>
        </div>

        <div>
          <h2>{t(locale, "ft.h2")}</h2>
          <ul>
            <li>
              <Link href={ROUTES.internationalPatients}>{t(locale, "ft.q1")}</Link>
            </li>
            <li>
              <Link href={ROUTES.admission}>{t(locale, "ft.q2")}</Link>
            </li>
            <li>
              <Link href="/#why">{t(locale, "ft.q3")}</Link>
            </li>
            <li>
              <Link href={ROUTES.patientRights}>{t(locale, "ft.q4")}</Link>
            </li>
            <li>
              <Link href={ROUTES.visiting}>{t(locale, "ft.q5")}</Link>
            </li>
            <li>
              <Link href={`${ROUTES.about}#history`}>{t(locale, "ft.q6")}</Link>
            </li>
          </ul>
        </div>

        <div>
          <h2>{t(locale, "ft.h3")}</h2>
          <ul className="hours">
            <li>
              <span>{t(locale, "ft.days")}</span>
              <b dir="ltr">{t(locale, "ft.time")}</b>
            </li>
            <li>
              <span>{t(locale, "ft.visit")}</span>
              <b dir="ltr">{t(locale, "ft.vtime")}</b>
            </li>
          </ul>
          <a
            className="foot-phone"
            href={`tel:${siteConfig.phone}`}
            dir="ltr"
          >
            {siteConfig.phoneDisplay}
          </a>
        </div>
      </div>

      <div className="container foot-bottom">
        <span>{t(locale, "ft.copy")}</span>
        <span>{t(locale, "ft.company")}</span>
      </div>
    </footer>
  );
}
