/**
 * SiteHeader.test.tsx — the public navigation boundary gate.
 *
 * The header is the one piece of chrome every page carries, so it is also the
 * most likely place for a link past the implementation boundary to creep in.
 * The owner-authorized public expansion restores the reference's real about,
 * doctors, guide, patient-information, international-patient and loan links.
 * Demo assistant/account/panel destinations remain forbidden.
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

  it("exposes the complete built public navigation and nothing forbidden", () => {
    const { container } = render(<SiteHeader locale="fa" pathname="/" />);
    const hrefs = new Set(
      [...container.querySelectorAll("a[href]")].map((node) => node.getAttribute("href")),
    );
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/about");
    expect(hrefs).toContain("/services");
    expect(hrefs).toContain("/services/surgical");
    expect(hrefs).toContain("/services/medical");
    expect(hrefs).toContain("/doctors");
    expect(hrefs).toContain("/guide");
    expect(hrefs).toContain("/visiting");
    expect(hrefs).toContain("/patient-rights");
    expect(hrefs).toContain("/admission");
    expect(hrefs).toContain("/international-patients");
    expect(hrefs).toContain("/loan");
    expect(hrefs).toContain("/#help");
    expect(hrefs).toContain("/#contact");
    for (const href of hrefs) {
      const inScope =
        href === "/" ||
        /^\/(?:about(?:#(?:history|mission|goals|policies|why))?|services(?:\/(?:surgical|medical))?|doctors|guide|visiting|patient-rights|admission|international-patients|loan)$/.test(href ?? "") ||
        href === "/#help" ||
        href === "/#contact" ||
        href === `tel:${siteConfig.phone}` || // B-1: substituted booking CTA (Q1)
        /^\/\?lang=(fa|en|ar)$/.test(href ?? "");
      expect(inScope, `out-of-scope header anchor: ${href}`).toBe(true);
    }
  });

  it("restores the reference search affordance now that public search exists", () => {
    const { container } = render(<SiteHeader locale="fa" pathname="/" />);
    const search = screen.getByRole("link", { name: t("fa", "help.title") });
    expect(search).toHaveAttribute("href", "/#help");
    expect(container.querySelector('a.icon-btn[href="/#help"]')).toBe(search);
  });

  it("carries no trace of demo assistant, account or panel destinations", () => {
    const { container } = render(<SiteHeader locale="fa" pathname="/" />);
    const hrefs = [...container.querySelectorAll("a[href]")].map((node) => node.getAttribute("href") ?? "");
    expect(hrefs.join("\n")).not.toMatch(/assistant|club|panel|admin|account|staff|finance|insurance|quality/i);
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

    for (const [pathname, href] of [
      ["/about", "/about"],
      ["/doctors/aghadoust", "/doctors"],
      ["/guide/gallbladder", "/guide"],
      ["/international-patients", "/international-patients"],
    ] as const) {
      const { container, unmount } = render(<SiteHeader locale="fa" pathname={pathname} />);
      expect(container.querySelector(`#menu a[href="${href}"]`)).toHaveAttribute("aria-current", "page");
      unmount();
    }

    // The .menu a.active rule the class keys into must exist in the port —
    // an active class with no rule behind it is a dead affordance.
    const css = readFileSync("src/styles/globalCss/reference.css", "utf8");
    expect(css).toMatch(/\.menu a\.active\{[^}]*background:var\(--primary-50\)/);
  });
});
