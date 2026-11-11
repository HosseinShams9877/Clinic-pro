/**
 * SiteFooter.tsx — the site chrome footer (Q4).
 *
 * Scope-aware rebuild of the reference footer (پلتفرم/index.html lines
 * 339–372): brand blurb, one sections column, opening hours, copyright.
 * The reference's six-item sections column and its quick-links column are
 * mostly links to pages past the Services section (about, clinics, visiting,
 * patient-rights, virtual tour, panels), which CLAUDE.md §2 rule 4 forbids
 * us to stub. Only the two links that stay inside the boundary survive:
 *   ft.l2 «کلینیک بیهوشی» → /services/anes
 *   ft.l3 «اتاق عمل جنرال» → /services
 * The staff-panel row is dropped for the same reason (Q4 ruling).
 */

import Link from "next/link";

import { ROUTES, siteConfig } from "@/config/site.config";
import type { Locale } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { LogoMark, Icon } from "@/components/shared/Icon";

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="mt-20 border-t border-border bg-accent-strong text-on-accent">
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
        {/* Brand blurb (ft.p, verbatim message). */}
        <div className="flex flex-col gap-4">
          <Link href={ROUTES.home} className="flex items-center gap-3">
            <span className="text-on-accent">
              <LogoMark size={40} />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[11px] font-medium">{t(locale, "brand.small")}</span>
              <span className="text-lg font-extrabold">{t(locale, "brand.name")}</span>
            </span>
          </Link>
          <p className="max-w-md text-[14px] leading-loose">{t(locale, "ft.p")}</p>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener"
            className="inline-flex w-fit rounded-full border border-on-accent/40 p-2.5 transition-colors hover:bg-on-accent/10"
            aria-label="Instagram"
          >
            <Icon name="i-insta" size={20} />
          </a>
        </div>

        {/* Sections — only the two in-boundary links. */}
        <nav aria-label={t(locale, "ft.h1")}>
          {/* h2 (not h4): the two footer blocks are top-level page sections, so
              their headings sit at level 2 — the page outline is then h1 → h2
              with no skipped levels on any route (P2 item 10). The size stays
              15 px via the explicit class; Tailwind preflight sizes no heading. */}
          <h2 className="mb-4 text-[15px] font-extrabold">{t(locale, "ft.h1")}</h2>
          <ul className="flex flex-col gap-2.5 text-[14px]">
            <li>
              <Link href="/services/anes" className="transition-opacity hover:opacity-80">
                {t(locale, "ft.l2")}
              </Link>
            </li>
            <li>
              <Link href={ROUTES.services} className="transition-opacity hover:opacity-80">
                {t(locale, "ft.l3")}
              </Link>
            </li>
          </ul>
        </nav>

        {/* Hours + phone. */}
        <div>
          <h2 className="mb-4 text-[15px] font-extrabold">{t(locale, "ft.h3")}</h2>
          <ul className="flex flex-col gap-3 text-[14px]">
            <li className="flex items-center justify-between gap-4">
              <span>{t(locale, "ft.days")}</span>
              <b dir="ltr">{t(locale, "ft.time")}</b>
            </li>
            <li className="flex items-center justify-between gap-4">
              <span>{t(locale, "ft.visit")}</span>
              <b dir="ltr">{t(locale, "ft.vtime")}</b>
            </li>
          </ul>
          <a
            href={`tel:${siteConfig.phone}`}
            dir="ltr"
            className="mt-5 inline-block text-[18px] font-extrabold transition-opacity hover:opacity-80"
          >
            {siteConfig.phoneDisplay}
          </a>
        </div>
      </div>

      <div className="border-t border-on-accent/20">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-[12.5px] sm:flex-row">
          <span>{t(locale, "ft.copy")}</span>
          <span>{t(locale, "ft.company")}</span>
        </div>
      </div>
    </footer>
  );
}
