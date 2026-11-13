import Link from "next/link";

import { ROUTES, siteConfig } from "@/config/site.config";
import { type Locale } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { Icon, LogoMark } from "@/components/shared/Icon";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";

/**
 * SiteHeader — a server component emitting the reference header DOM
 * (پلتفرم/index.html lines 88–126) verbatim, hooked to the fidelity port in
 * src/styles/globalCss/reference.css:
 *
 *   header.site-header > .container > nav.nav
 *     > a.brand (span.brand-mark + span.brand-text)
 *     > ul.menu#menu (li / li.has-sub > a + button.sub-tg + ul.sub / li)
 *     > .nav-tools (.lang island + CTA + burger island)
 *
 * The `.site-header` chrome comes entirely from the components layer — no
 * Tailwind layout classes here (the previous `sticky top-0 … backdrop-blur`
 * classes fought the ported reference rule `.site-header{position:absolute}`).
 *
 * The reference CTA points at patient-panel.html?go=new (out of scope); per
 * Q1 the substituted action is the clinic phone number, keeping the exact
 * reference affordance (`.btn.btn-primary.btn-sm.hide-sm` + i-calendar +
 * cta.book) without a fake route.
 *
 * The active menu link (B-6): the reference bakes it into static markup —
 * index.html L101 gives the home link `class="active"` (no aria-current),
 * services.html L77 gives the services link `class="active"` plus
 * `aria-current="page"`. On the home page that static state is then live:
 * main.js's scroll-spy re-toggles `.active` as sections cross the mid-line
 * (the MenuSpy island). `id="top"` on the header element is the reference's
 * own anchor target (index.html line 89).
 */
export function SiteHeader({ locale, pathname }: { locale: Locale; pathname: string }) {
  /** The current section's link is active in the reference's static markup. */
  const isHome = pathname === ROUTES.home;
  const isServices = pathname === ROUTES.services || pathname.startsWith(`${ROUTES.services}/`);

  return (
    <header className="site-header" id="top">
      <div className="container">
        <nav className="nav" aria-label={t(locale, "a11y.menu")}>
          <Link className="brand" href={ROUTES.home}>
            <span className="brand-mark">
              <LogoMark size={32} />
            </span>
            <span className="brand-text">
              <small>{t(locale, "brand.small")}</small>
              <strong>{t(locale, "brand.name")}</strong>
            </span>
          </Link>

          <ul className="menu" id="menu">
            <li>
              <Link href={ROUTES.home} className={isHome ? "active" : undefined}>
                {t(locale, "nav.home")}
              </Link>
            </li>
            <li className="has-sub">
              <Link
                href={ROUTES.services}
                className={isServices ? "active" : undefined}
                aria-current={isServices ? "page" : undefined}
              >
                {t(locale, "nav.services")}
              </Link>
              <button
                type="button"
                className="sub-tg"
                aria-label={t(locale, "nav.services")}
                aria-expanded="false"
              >
                <Icon name="i-chev" size={18} />
              </button>
              <ul className="sub">
                <li>
                  <Link href={`${ROUTES.services}#surgical`}>
                    {t(locale, "nav.svcSurg")}
                  </Link>
                </li>
                <li>
                  <Link href={`${ROUTES.services}#medical`}>
                    {t(locale, "nav.svcMed")}
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <Link href="/#contact">{t(locale, "nav.contact")}</Link>
            </li>
          </ul>

          <div className="nav-tools">
            <LanguageSwitcher locale={locale} />
            <Link
              className="btn btn-primary btn-sm hide-sm"
              href={`tel:${siteConfig.phone}`}
            >
              <Icon name="i-calendar" size={18} />
              <span>{t(locale, "cta.book")}</span>
            </Link>
            <MobileMenu locale={locale} />
          </div>
        </nav>
      </div>
    </header>
  );
}
