"use client";

import { useEffect, useRef } from "react";

import { type Locale } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { Icon } from "@/components/shared/Icon";

/**
 * MobileMenu — the reference `#burger` island (پلتفرم/assets/js/main.js
 * L40–L52). It is a single icon button that toggles the *server-rendered*
 * `#menu` in place; the panel itself is the same `<ul class="menu">` the
 * desktop nav uses, restyled by the ≤1024px media block in the reference
 * port (reference.css "header responsive").
 *
 * Replicated main.js behaviors:
 *   - burger click (stopPropagation) → `#menu.classList.toggle("open")` +
 *     its aria-expanded;
 *   - `.sub-tg` click (stopPropagation) → `li.has-sub.classList.toggle("open")`
 *     + its aria-expanded (the mobile submenu accordion);
 *   - any menu link click → close the menu (and collapse open submenus);
 *   - document click → close the menu.
 *
 * Two a11y behaviors the reference does NOT have are kept from the Phase 2
 * pass because they are release gates (SEO_ACCESSIBILITY_SECURITY.md §5):
 * Escape closes the open menu and focus returns to the burger.
 */
export function MobileMenu({ locale }: { locale: Locale }) {
  const burgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const burger = burgerRef.current;
    if (!burger) return;
    const menu = burger
      .closest(".site-header")
      ?.querySelector<HTMLUListElement>("#menu");
    if (!menu) return;

    const setExpanded = (el: Element | null, open: boolean) => {
      if (el instanceof HTMLElement) el.setAttribute("aria-expanded", String(open));
    };

    const closeMenu = () => {
      menu.classList.remove("open");
      setExpanded(burger, false);
      menu.querySelectorAll("li.has-sub.open").forEach((li) => {
        li.classList.remove("open");
        setExpanded(li.querySelector(".sub-tg"), false);
      });
    };

    const onBurgerClick = (event: MouseEvent) => {
      event.stopPropagation();
      const open = menu.classList.toggle("open");
      setExpanded(burger, open);
    };

    const onMenuClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const toggle = target?.closest(".sub-tg");
      if (toggle) {
        // Submenu accordion (main.js sub-tg handler).
        event.stopPropagation();
        const li = toggle.closest("li");
        if (!li) return;
        const open = li.classList.toggle("open");
        setExpanded(toggle, open);
        return;
      }
      if (target?.closest("a")) closeMenu(); // main.js "menu a click → close"
    };

    const onDocumentClick = () => {
      if (menu.classList.contains("open")) closeMenu();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.classList.contains("open")) {
        closeMenu();
        burger.focus();
      }
    };

    burger.addEventListener("click", onBurgerClick);
    menu.addEventListener("click", onMenuClick);
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      burger.removeEventListener("click", onBurgerClick);
      menu.removeEventListener("click", onMenuClick);
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <button
      ref={burgerRef}
      type="button"
      className="icon-btn burger"
      aria-label={t(locale, "a11y.menu")}
      aria-expanded="false"
      aria-controls="menu"
    >
      <Icon name="i-menu" size={20} />
    </button>
  );
}
