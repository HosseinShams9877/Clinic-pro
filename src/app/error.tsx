/**
 * error.tsx — the global error boundary (Phase 2, item 4).
 *
 * Next requires this to be a client component (it ships `reset`), so the
 * locale cannot come from the server-side `getLocale()` like the rest of the
 * site. Instead it reads `<html lang>`, which the root layout bakes
 * server-side on every request (layout.tsx) — the same source of truth, read
 * from the other side. `isLocale` guards it; anything unexpected falls back to
 * fa (Persian-first, always).
 *
 * Renders inside the root layout, so the error surface keeps the header,
 * footer, skip link, lang direction and JSON-LD. The raw error is intentionally
 * never surfaced to the visitor — it is UI chrome, not diagnostic output.
 *
 * The B-5 fidelity port: the boundary is the reference's own inner-page hero
 * frame (`section.phx > .phx-in > (.phx-t + .phx-v)`, style.css L769-786) —
 * the same card, radius, crumbs-free h1 clamp and 360px split as the real
 * inner pages. The reference has no error page of its own, so the frame's fill
 * is the app's chrome: the copy is the message catalog (err.*, nav.*), the
 * actions are the reference's own `.btn` treatments, and the `.phx-v` slot
 * carries a single decorative shield icon (aria-hidden, exactly as the
 * reference marks its own `.phx-v`).
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ROUTES } from "@/config/site.config";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { Icon } from "@/components/shared/Icon";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // <html lang> is set server-side by the root layout; read it after mount so
  // the SSR pass and the first client pass agree (no hydration mismatch).
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  useEffect(() => {
    const lang = document.documentElement.lang;
    if (isLocale(lang)) setLocale(lang);
  }, []);

  return (
    <section className="phx">
      <div className="container">
        <div className="phx-in">
          <div className="phx-t">
            <h1>{t(locale, "err.errorTitle")}</h1>
            <p>{t(locale, "err.errorBody")}</p>
            <div className="phx-cta">
              <button type="button" onClick={reset} className="btn btn-primary">
                <Icon name="i-arrow" className="arr" />
                <span>{t(locale, "err.retry")}</span>
              </button>
              <Link href={ROUTES.home} className="btn btn-line">
                <Icon name="i-arrow" className="arr" />
                <span>{t(locale, "nav.home")}</span>
              </Link>
            </div>
          </div>
          <div className="phx-v" aria-hidden="true">
            <span className="phx-ico">
              <Icon name="i-shield" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
