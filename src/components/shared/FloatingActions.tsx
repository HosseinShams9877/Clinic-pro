/**
 * FloatingActions.tsx — the reference's floating quick-actions bar (.qa),
 * trimmed to the implemented scope: the call button (qa-call) and the
 * back-to-top button (qa-top). The reference's qa-book pointed at the
 * patient panel, which is past the boundary, so it is not reproduced
 * (no stub, no dead button — CLAUDE.md §2 rule 4).
 *
 * Client component because the bar only appears after the user scrolls
 * (>= 500px, same threshold as home.js) and the top button scrolls the
 * window. Both are progressive enhancements: the links are real anchors,
 * so nothing here is load-bearing for content.
 *
 * The root also carries the `float-actions` hook class so the print
 * stylesheet can drop the bar on paper (print.css, P2 item 5).
 */

"use client";

import { useEffect, useState } from "react";

import { siteConfig } from "@/config/site.config";
import type { Locale } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { Icon } from "@/components/shared/Icon";

/** Scroll threshold at which the bar appears (reference home.js onScroll). */
const SHOW_AFTER = 500;

export function FloatingActions({ locale }: { locale: Locale }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`float-actions fixed bottom-5 z-40 flex flex-col gap-2.5 transition-all duration-300 ltr:right-4 rtl:left-4 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <a
        href={`tel:${siteConfig.phone}`}
        aria-label={t(locale, "h.qaCall")}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-strong text-on-accent shadow-2 transition hover:opacity-90"
      >
        <Icon name="i-phone" size={22} />
      </a>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={t(locale, "a11y.top")}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-primary shadow-2 transition hover:bg-primary-50"
      >
        <Icon name="i-chev" size={22} className="rotate-180" />
      </button>
    </div>
  );
}
