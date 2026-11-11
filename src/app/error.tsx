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
 * Renders inside the root layout, so the 404/error surface keeps the header,
 * footer, skip link, lang direction and JSON-LD. The raw error is intentionally
 * never surfaced to the visitor — it is UI chrome, not diagnostic output.
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
    <section className="relative overflow-hidden bg-accent-strong text-on-accent">
      <div className="container flex flex-col items-center gap-6 py-20 text-center md:py-28">
        <h1 className="max-w-2xl text-[28px] font-extrabold leading-tight md:text-[36px]">
          {t(locale, "err.errorTitle")}
        </h1>
        <p className="max-w-xl text-[15px] leading-loose on-accent">{t(locale, "err.errorBody")}</p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-on-accent px-6 py-3.5 text-[15px] font-bold text-accent-strong transition hover:opacity-90"
          >
            <Icon name="i-arrow" size={20} className="arr" />
            {t(locale, "err.retry")}
          </button>
          <Link
            href={ROUTES.home}
            className="inline-flex items-center gap-2 rounded-lg border border-on-accent/50 px-6 py-3.5 text-[15px] font-bold text-on-accent transition hover:bg-on-accent/10"
          >
            {t(locale, "nav.home")}
          </Link>
        </div>
      </div>
    </section>
  );
}
