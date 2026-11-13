/**
 * SiteHeader.test.tsx — the navigation boundary gate (P1-06 / Q4).
 *
 * The header is the one piece of chrome every page carries, so it is also the
 * most likely place for a link past the implementation boundary to creep in.
 * This test pins its anchors to exactly the in-scope set: the home and
 * services routes (plus the two group anchors and the #contact fragment) and
 * the language switcher's trilingual ?lang= toggles. Anything the reference
 * points at beyond the Services section (about, doctors, guide, loan, club,
 * panels, booking) must be absent, not merely unstyled.
 *
 * B-2 (UI fix pass): the reference's magnifier affordance is deliberately
 * absent. Its aria-label read as a search action while it pointed at /#help,
 * and no in-scope search surface exists — a fake button under CLAUDE.md §2
 * rule 4. The /#help section itself stays on the home page; only the
 * search-styled header affordance is gone.
 *
 * Visual fidelity pass (B-1): the reference's header CTA pill
 * (`.btn.btn-primary.btn-sm.hide-sm`, index.html line 122) is restored, with
 * its out-of-scope `patient-panel.html?go=new` target substituted by the
 * clinic phone number per Q1 — the exact same affordance the demo ships, no
 * fake route. Test 2's allow-list therefore admits that one substituted
 * `tel:` href alongside the in-scope anchors.
 *
 * Visual fidelity pass (B-6): the header now takes the current pathname and
 * bakes the reference's static active state into it — home active on `/`
 * (index.html L101: `class="active"`, no aria-current), services active on
 * the landing and every category page (services.html L77:
 * `class="active" aria-current="page"`). The scroll-driven half of that
 * lives in the MenuSpy island; this is the server-rendered half, so the
 * active pill is in the first paint with no hydration flash.
 */

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { siteConfig } from "@/config/site.config";
import { LOCALES } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("renders for the canonical fa locale", () => {
    const { container } = render(<SiteHeader locale="fa" pathname="/" />);
    expect(container.querySelector("header")).not.toBeNull();
    const nav = container.querySelector("nav");
    expect(nav?.getAttribute("aria-label")).toBe(t("fa", "a11y.menu"));
  });

  it("exposes exactly the in-scope desktop anchors — nothing further", () => {
    const { container } = render(<SiteHeader locale="fa" pathname="/" />);
    const hrefs = new Set(
      [...container.querySelectorAll("a[href]")].map((node) => node.getAttribute("href")),
    );
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/services");
    expect(hrefs).toContain("/services#surgical");
    expect(hrefs).toContain("/services#medical");
    expect(hrefs).toContain("/#contact");
    for (const href of hrefs) {
      const inScope =
        href === "/" ||
        href === "/#contact" ||
        href === "/services" ||
        href === "/services#surgical" ||
        href === "/services#medical" ||
        href === `tel:${siteConfig.phone}` || // B-1: substituted booking CTA (Q1)
        /^\/\?lang=(fa|en|ar)$/.test(href ?? "");
      expect(inScope, `out-of-scope header anchor: ${href}`).toBe(true);
    }
  });

  it("carries no search affordance (B-2: no fake buttons)", () => {
    // The magnifier is gone on purpose: nothing in-scope answers a search
    // action, so an i-search glyph in the chrome would be a fake button. A
    // header link labelled with an aria-label (only the reference's
    // magnifier ever had one in the header) is itself the regression signal.
    const { container } = render(<SiteHeader locale="fa" pathname="/" />);
    expect(container.querySelectorAll("header a[aria-label]")).toHaveLength(0);
    expect(container.querySelectorAll("header a").length).toBeGreaterThan(0);
    const hrefs = [...container.querySelectorAll("header a[href]")].map((node) => node.getAttribute("href"));
    expect(hrefs).not.toContain("/#help");
    // No glyph in the header may carry a search affordance's accessible name.
    expect(screen.queryByRole("link", { name: t("fa", "help.title") })).toBeNull();
  });

  it("carries no trace of the reference's out-of-scope destinations", () => {
    const { container } = render(<SiteHeader locale="fa" pathname="/" />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/doctors|about|guide|assistant|intl|loan|club|panel|booking|reserve/i);
  });

  it("labels its nav with the localized strings in all three locales", () => {
    for (const locale of LOCALES) {
      const { container, unmount } = render(<SiteHeader locale={locale} pathname="/" />);
      const nav = container.querySelector("nav");
      expect(nav?.textContent).toContain(t(locale, "nav.home"));
      expect(nav?.textContent).toContain(t(locale, "nav.services"));
      expect(nav?.textContent).toContain(t(locale, "nav.contact"));
      expect(container.innerHTML).toContain(t(locale, "brand.name"));
      unmount();
    }
  });

  it("bakes the reference's static active state into the menu (B-6)", () => {
    // index.html L101: on the home page the home link carries class="active"
    // (no aria-current) exactly as the reference ships it. Scoped to #menu —
    // the brand link also targets "/" and is never an active-state carrier.
    const home = render(<SiteHeader locale="fa" pathname="/" />);
    const menu = home.container.querySelector("#menu");
    const homeLink = menu?.querySelector('a[href="/"]');
    expect(homeLink?.className).toContain("active");
    expect(homeLink?.getAttribute("aria-current")).toBeNull();
    const svcOnHome = menu?.querySelector('a[href="/services"]');
    expect(svcOnHome?.className ?? "").not.toContain("active");
    home.unmount();

    // services.html L77: on the services section the services link carries
    // class="active" plus aria-current="page" — including on the category
    // pages, whose content is part of that section.
    for (const pathname of ["/services", "/services/gyn"]) {
      const { container, unmount } = render(<SiteHeader locale="fa" pathname={pathname} />);
      const nav = container.querySelector("#menu");
      const svc = nav?.querySelector('a[href="/services"]');
      expect(svc?.className).toContain("active");
      expect(svc?.getAttribute("aria-current")).toBe("page");
      expect(nav?.querySelector('a[href="/"]')?.className ?? "").not.toContain("active");
      // The active class rides the reference's own .menu a.active styling:
      // the contact (hash) link is never statically active on any route.
      expect(nav?.querySelector('a[href="/#contact"]')?.className ?? "").not.toContain("active");
      unmount();
    }

    // The .menu a.active rule the class keys into must exist in the port —
    // an active class with no rule behind it is a dead affordance.
    const css = readFileSync("src/styles/globalCss/reference.css", "utf8");
    expect(css).toMatch(/\.menu a\.active\{[^}]*background:var\(--primary-50\)/);
  });
});
