/**
 * SiteHeader.tsx — the site chrome header (Q4 navigation).
 *
 * Scope-aware rebuild of the reference header (پلتفرم/services.html lines
 * 63–108): brand, خانه, خدمات with its two group sub-links (nav.svcSurg /
 * nav.svcMed), تماس با ما → /#contact, the language switcher and the mobile
 * burger. Everything the reference points at that lives past the Services
 * section (about/doctors/guide/assistant/intl/panels) is omitted — the
 * implementation boundary is "start of the public site through the complete
 * Services section", and CLAUDE.md §2 rule 4 forbids stub links for the rest.
 * The booking CTA is likewise gone (Q1: contact/tel only).
 *
 * Desktop group sub-menu opens on hover AND focus-within, so it is keyboard
 * reachable with zero client JS. The burger and the language list are the two
 * client islands (MobileMenu, LanguageSwitcher).
 */

import Link from "next/link";

import { ROUTES, siteConfig } from "@/config/site.config";
import type { Locale } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { Icon, LogoMark } from "@/components/shared/Icon";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { MobileMenu } from "@/components/layout/MobileMenu";

export function SiteHeader({ locale }: { locale: Locale }) {
  return (
    <header className="site-header sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="container flex h-[72px] items-center justify-between gap-4">
        <Link href={ROUTES.home} className="brand flex items-center gap-3">
          <span className="text-primary">
            <LogoMark size={40} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[11px] font-medium text-muted">{t(locale, "brand.small")}</span>
            <span className="text-lg font-extrabold text-foreground">{t(locale, "brand.name")}</span>
          </span>
        </Link>

        {/* Desktop nav — visible from md up. */}
        <nav className="hidden md:block" aria-label={t(locale, "a11y.menu")}>
          <ul className="flex items-center gap-1">
            <li>
              <Link
                href={ROUTES.home}
                className="rounded-md px-3 py-2 text-[15px] font-medium text-muted transition-colors hover:bg-primary-50 hover:text-primary"
              >
                {t(locale, "nav.home")}
              </Link>
            </li>
            <li className="group relative">
              <Link
                href={ROUTES.services}
                className="flex items-center gap-1 rounded-md px-3 py-2 text-[15px] font-medium text-muted transition-colors hover:bg-primary-50 hover:text-primary group-hover:text-primary group-focus-within:text-primary"
              >
                {t(locale, "nav.services")}
                <Icon name="i-chev" size={16} className="transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
              </Link>
              {/* Anchored at the reading-direction start edge of the trigger
                  (inset-inline-start:0, min-width:236px — mirroring the
                  reference .menu .sub contract) so in RTL it opens
                  right-to-left under the trigger instead of stretching the
                  trigger's full width. */}
              <ul className="invisible absolute start-0 top-full z-10 pt-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                {/* overflow-hidden would clip the focus ring (outline-offset 3px +
                    2px ring = 5px extent) of the links inside; the corner radius
                    is kept by rounding the first/last link instead (P2 item 6). */}
                <li className="min-w-[236px] rounded-lg border border-border bg-surface shadow-2">
                  <Link
                    href={`${ROUTES.services}#surgical`}
                    className="block whitespace-nowrap rounded-t-lg px-4 py-2.5 text-[14px] text-foreground transition-colors hover:bg-primary-50 hover:text-primary"
                  >
                    {t(locale, "nav.svcSurg")}
                  </Link>
                  <Link
                    href={`${ROUTES.services}#medical`}
                    className="block whitespace-nowrap rounded-b-lg px-4 py-2.5 text-[14px] text-foreground transition-colors hover:bg-primary-50 hover:text-primary"
                  >
                    {t(locale, "nav.svcMed")}
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <Link
                href={`${ROUTES.home}#contact`}
                className="rounded-md px-3 py-2 text-[15px] font-medium text-muted transition-colors hover:bg-primary-50 hover:text-primary"
              >
                {t(locale, "nav.contact")}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} />
          {/* Burger — the mobile menu island, visible below md. */}
          <MobileMenu locale={locale} />
        </div>
      </div>
    </header>
  );
}
