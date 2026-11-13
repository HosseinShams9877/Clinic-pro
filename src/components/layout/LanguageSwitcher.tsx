"use client";
/**
 * LanguageSwitcher.tsx — the trilingual switcher (fa / en / ar).
 *
 * The reference home-rolls this as a dropdown of buttons that rewrite
 * data-i18n attributes client-side (پلتفرم/assets/js/main.js L21–L38). The
 * same three options are here plain anchors carrying `?lang=<locale>`:
 * middleware mirrors the value into the `lang` cookie and the server
 * re-renders the whole page in the chosen locale.
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
 *
 * The visual layer is the reference's own: `.lang` / `.lang-btn` /
 * `.lang-list` from style.css L111–L119 (ported into reference.css). The
 * reference's options are `<button>`s; ours are anchors for the reason
 * above, so the ported `.lang-list` selectors match both (see reference.css
 * note on the `.lang-list button, .lang-list a` rule).
 */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import type { Locale } from "@/core/i18n/locales";
import { LOCALES } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { Icon } from "@/components/shared/Icon";

const LABELS: Readonly<Record<Locale, string>> = { fa: "فارسی", en: "English", ar: "العربية" };
const CODES: Readonly<Record<Locale, string>> = { fa: "FA", en: "EN", ar: "AR" };

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  // `pathname` is null in the isolated header test (no router context);
  // the fallback keeps the option hrefs root-relative there.
  const current = pathname ?? "/";

  useEffect(() => {
    if (!open) return;
    const onDocumentClick = (event: MouseEvent) => {
      // main.js: any click outside the widget closes the dropdown.
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onDocumentClick, { capture: true });
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={`lang${open ? " open" : ""}`} ref={wrapRef}>
      <button
        type="button"
        className="lang-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t(locale, "lang.label")}: ${CODES[locale]}`}
        onClick={(e) => { e.stopPropagation(); 
            console.log("CLICKED! open was:", open);

          setOpen((value) => !value); }}
      >
        <span>{CODES[locale]}</span>
        <Icon name="i-chev" size={16} />
      </button>
      {open && (
        <ul className="lang-list" role="menu" style={{ display: open ? 'block' : 'none', opacity: 1, visibility: 'visible' }}>
          {LOCALES.map((option) => (
            <li key={option} role="none">
              {/* Plain <a>, deliberately NOT next/link: see the file header. */}
              <a
                role="menuitem"
                href={`${current}?lang=${option}`}
                aria-current={option === locale ? "true" : undefined}
                className={option === locale ? "on" : undefined}
                onClick={() => setOpen(false)}
              >
                {LABELS[option]}
                <b>{CODES[option]}</b>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
