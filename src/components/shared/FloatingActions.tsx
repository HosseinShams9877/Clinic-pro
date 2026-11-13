/**
 * FloatingActions.tsx — the reference's floating quick-actions bar (.qa),
 * on the reference's own markup and styles (پلتفرم/index.html: `.qa >
 * .qa-call` + `.qa-book` + `button.qa-top`).
 *
 * Scope substitution (Q1, OPEN_QUESTIONS.md): the reference's `.qa-book`
 * pointed at `patient-panel.html?go=new`, which is past the implementation
 * boundary. Per Q1 the verified phone CTA `tel:+983155154000` is the primary
 * action, so `.qa-book` dials the admissions desk instead of linking to a
 * page that does not exist — the bar keeps its exact reference shape and
 * behaviour (three buttons, `.qa-call` ring animation, `.qa-top` chevron)
 * with no stub and no dead link.
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
    <div className={`float-actions qa${visible ? " show" : ""}`} id="qa">
      <a className="qa-call" href={`tel:${siteConfig.phone}`} aria-label={t(locale, "h.qaCall")}>
        <Icon name="i-phone" />
        <span>{t(locale, "h.qaCall")}</span>
      </a>
      {/* Q1: the reference's booking button dials admissions (its original
          destination, patient-panel.html, is out of scope). */}
      <a className="qa-book" href={`tel:${siteConfig.phone}`} aria-label={t(locale, "cta.request")}>
        <Icon name="i-calendar" />
        <span>{t(locale, "cta.request")}</span>
      </a>
      <button
        className="qa-top"
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={t(locale, "a11y.top")}
      >
        <Icon name="i-chev" />
      </button>
    </div>
  );
}
