/**
 * not-found.tsx — the global 404 page (Phase 2, item 4).
 *
 * A real page, in the site's visual identity, not a stub: it renders inside the
 * root layout (which bakes <html lang dir> server-side and carries the header,
 * footer, skip link and JSON-LD), so the 404 is Persian-first and RTL by
 * default and fully trilingual — exactly like every implemented route.
 *
 * Serves two cases: a route that does not exist at all, and
 * /services/<unknown-id>, where page.tsx calls notFound() (P1-10) and the
 * router falls through to this boundary.
 *
 * The reference has no 404 page of its own, so every string here is UI chrome
 * from the message catalog (err.*, nav.*) — no invented clinic content, and no
 * text hardcoded in the component.
 */

import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/config/site.config";
import { getLocale } from "@/core/i18n/getLocale";
import { t } from "@/modules/i18n/messages";
import { routeMetadata } from "@/modules/seo/lib/metadata";
import { Icon } from "@/components/shared/Icon";

export const metadata: Metadata = routeMetadata({
  title: t("fa", "err.notFoundTitle"),
  description: t("fa", "err.notFoundBody"),
  path: ROUTES.home,
});

export default async function NotFound() {
  const locale = await getLocale();

  return (
    <section className="relative overflow-hidden bg-accent-strong text-on-accent">
      <div className="container flex flex-col items-center gap-6 py-20 text-center md:py-28">
        {/* The status code is chrome, not content — the only non-translated
            text on the page. */}
        <span className="text-[64px] font-extrabold leading-none md:text-[88px]" aria-hidden="true">
          404
        </span>
        <h1 className="max-w-2xl text-[28px] font-extrabold leading-tight md:text-[36px]">
          {t(locale, "err.notFoundTitle")}
        </h1>
        <p className="max-w-xl text-[15px] leading-loose on-accent">{t(locale, "err.notFoundBody")}</p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href={ROUTES.home}
            className="inline-flex items-center gap-2 rounded-lg bg-on-accent px-6 py-3.5 text-[15px] font-bold text-accent-strong transition hover:opacity-90"
          >
            <Icon name="i-arrow" size={20} className="arr" />
            {t(locale, "nav.home")}
          </Link>
          <Link
            href={ROUTES.services}
            className="inline-flex items-center gap-2 rounded-lg border border-on-accent/50 px-6 py-3.5 text-[15px] font-bold text-on-accent transition hover:bg-on-accent/10"
          >
            <Icon name="i-layers" size={20} />
            {t(locale, "nav.services")}
          </Link>
        </div>
      </div>
    </section>
  );
}
