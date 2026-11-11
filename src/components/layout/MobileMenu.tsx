"use client";
/**
 * MobileMenu.tsx — the burger-driven disclosure nav, below md.
 *
 * The scope-limited mirror of the reference `.menu` (services.html lines
 * 72–85): home, services, the two service groups, contact. No links to
 * pages past the Services section (CLAUDE.md §2 rule 4: no dead ends).
 * Closes on blur-away and on link activation; focus returns to the burger.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { ROUTES } from "@/config/site.config";
import type { Locale } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { Icon } from "@/components/shared/Icon";

export function MobileMenu({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current !== null &&
        !panelRef.current.contains(event.target as Node) &&
        burgerRef.current !== null &&
        !burgerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <>
      <button
        ref={burgerRef}
        type="button"
        className="inline-flex rounded-md p-2 text-foreground transition-colors hover:bg-primary-50 md:hidden"
        aria-label={t(locale, "a11y.menu")}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name={open ? "i-x" : "i-menu"} size={24} />
      </button>

      {open && (
        <div
          ref={panelRef}
          id="mobile-menu"
          className="absolute inset-x-0 top-[72px] z-40 border-b border-border bg-surface shadow-2 md:hidden"
        >
          <nav className="container py-3" aria-label={t(locale, "a11y.menu")}>
            <ul className="flex flex-col gap-1">
              <li>
                <Link
                  href={ROUTES.home}
                  className="block rounded-md px-3 py-2.5 text-[15px] font-medium text-foreground transition-colors hover:bg-primary-50 hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  {t(locale, "nav.home")}
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.services}
                  className="block rounded-md px-3 py-2.5 text-[15px] font-medium text-foreground transition-colors hover:bg-primary-50 hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  {t(locale, "nav.services")}
                </Link>
              </li>
              <li>
                <Link
                  href={`${ROUTES.services}#surgical`}
                  className="block rounded-md px-3 py-2.5 ps-8 text-[14px] text-muted transition-colors hover:bg-primary-50 hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  {t(locale, "nav.svcSurg")}
                </Link>
              </li>
              <li>
                <Link
                  href={`${ROUTES.services}#medical`}
                  className="block rounded-md px-3 py-2.5 ps-8 text-[14px] text-muted transition-colors hover:bg-primary-50 hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  {t(locale, "nav.svcMed")}
                </Link>
              </li>
              <li>
                <Link
                  href={`${ROUTES.home}#contact`}
                  className="block rounded-md px-3 py-2.5 text-[15px] font-medium text-foreground transition-colors hover:bg-primary-50 hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  {t(locale, "nav.contact")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
