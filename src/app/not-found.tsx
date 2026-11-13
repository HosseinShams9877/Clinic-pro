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
 * The B-5 fidelity port: the page is the reference's own inner-page hero
 * frame — `section.phx > .container > .phx-in > (.phx-t + .phx-v)`
 * (style.css L769-786, as used by about.html L126-135 and every other inner
 * page) — so the 404 speaks exactly the reference's design language: the same
 * card, radius, crumbs, h1 clamp and 360px split as the real inner pages,
 * with light theme and the reference's own `.btn` treatments.
 *
 * The reference has no 404 page of its own, so the frame's fill is the app's
 * chrome, never invented clinic content: the copy is the message catalog
 * (err.*, nav.*), the recovery link is the implemented Services landing, and
 * the `.phx-v` slot carries the status code as pure decoration
 * (aria-hidden, exactly as the reference marks its own `.phx-v`).
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
    <section className="phx">
      <div className="container">
        <div className="phx-in">
          <div className="phx-t">
            <nav className="crumbs" aria-label="breadcrumb">
              <Link href={ROUTES.home}>{t(locale, "nav.home")}</Link>
              <span>/</span>
              <b aria-current="page">{t(locale, "err.notFoundTitle")}</b>
            </nav>
            <h1>{t(locale, "err.notFoundTitle")}</h1>
            <p>{t(locale, "err.notFoundBody")}</p>
            <div className="phx-cta">
              <Link href={ROUTES.services} className="btn btn-primary">
                <Icon name="i-layers" />
                <span>{t(locale, "nav.services")}</span>
              </Link>
            </div>
          </div>
          {/* The status code is chrome, not content — the only non-translated
              text on the page, parked in the frame's own decorative slot. */}
          <div className="phx-v" aria-hidden="true">
            <span className="phx-code">404</span>
          </div>
        </div>
      </div>
    </section>
  );
}
