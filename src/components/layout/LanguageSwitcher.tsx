"use client";
/**
 * LanguageSwitcher.tsx — the trilingual switcher (fa / en / ar).
 *
 * The reference home-rolls this as a dropdown of buttons that rewrite
 * data-i18n attributes client-side. Here the same three options are plain
 * anchors carrying `?lang=<locale>`: middleware mirrors the value into the
 * `lang` cookie and the server re-renders the whole page in the chosen
 * locale.
 *
 * The options MUST stay plain `<a>` (never next/link `<Link>`). A `?lang=`
 * change is a searchParams-only update of the same route segment: next/link
 * re-renders the segment (page content flips) but does NOT re-execute the
 * root layout, leaving `<html lang>`, `<html dir>`, the header nav labels
 * and this switcher's own label stuck at the previous locale while the page
 * content renders in the new one (observed: en content under dir="rtl",
 * switcher reading "FA"). A native anchor is a document navigation, so the
 * server rebuilds `<html lang dir>` from the cookie — no client-only fake,
 * and it still works without JS.
 */

import { useState } from "react";
import { usePathname } from "next/navigation";

import type { Locale } from "@/core/i18n/locales";
import { LOCALES } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { Icon } from "@/components/shared/Icon";

const LABELS: Readonly<Record<Locale, string>> = { fa: "فارسی", en: "English", ar: "العربية" };
const CODES: Readonly<Record<Locale, string>> = { fa: "FA", en: "EN", ar: "AR" };

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const current = pathname ?? "/";

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-2 text-[13px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t(locale, "lang.label")}: ${CODES[locale]}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{CODES[locale]}</span>
        <Icon name="i-globe" size={18} />
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute end-0 top-full z-50 mt-2 rounded-lg border border-border bg-surface py-1 shadow-2"
        >
          {/* No overflow-hidden: it would clip the focus ring of the menuitems
              (5px ring extent vs 1px inner padding here). The first/last
              menuitem carry the corner radius instead (P2 item 6). */}
          {LOCALES.map((option, i) => (
            <li key={option} role="none">
              {/* Plain <a>, deliberately NOT next/link: see the file header. */}
              <a
                role="menuitem"
                href={`${current}?lang=${option}`}
                aria-current={option === locale ? "true" : undefined}
                className={`flex min-w-[140px] items-center justify-between gap-3 px-4 py-2 text-[14px] text-foreground transition-colors hover:bg-primary-50 hover:text-primary${
                  i === 0 ? " rounded-t-lg" : i === LOCALES.length - 1 ? " rounded-b-lg" : ""
                }`}
                onClick={() => setOpen(false)}
              >
                {LABELS[option]}
                <b className="text-[11px] font-bold text-muted">{CODES[option]}</b>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
