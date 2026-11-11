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
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { LOCALES } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("renders for the canonical fa locale", () => {
    const { container } = render(<SiteHeader locale="fa" />);
    expect(container.querySelector("header")).not.toBeNull();
    const nav = container.querySelector("nav");
    expect(nav?.getAttribute("aria-label")).toBe(t("fa", "a11y.menu"));
  });

  it("exposes exactly the in-scope desktop anchors — nothing further", () => {
    const { container } = render(<SiteHeader locale="fa" />);
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
        /^\/\?lang=(fa|en|ar)$/.test(href ?? "");
      expect(inScope, `out-of-scope header anchor: ${href}`).toBe(true);
    }
  });

  it("carries no search affordance (B-2: no fake buttons)", () => {
    // The magnifier is gone on purpose: nothing in-scope answers a search
    // action, so an i-search glyph in the chrome would be a fake button. A
    // header link labelled with an aria-label (only the reference's
    // magnifier ever had one in the header) is itself the regression signal.
    const { container } = render(<SiteHeader locale="fa" />);
    expect(container.querySelectorAll("header a[aria-label]")).toHaveLength(0);
    expect(container.querySelectorAll("header a").length).toBeGreaterThan(0);
    const hrefs = [...container.querySelectorAll("header a[href]")].map((node) => node.getAttribute("href"));
    expect(hrefs).not.toContain("/#help");
    // No glyph in the header may carry a search affordance's accessible name.
    expect(screen.queryByRole("link", { name: t("fa", "help.title") })).toBeNull();
  });

  it("carries no trace of the reference's out-of-scope destinations", () => {
    const { container } = render(<SiteHeader locale="fa" />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/doctors|about|guide|assistant|intl|loan|club|panel|booking|reserve/i);
  });

  it("labels its nav with the localized strings in all three locales", () => {
    for (const locale of LOCALES) {
      const { container, unmount } = render(<SiteHeader locale={locale} />);
      const nav = container.querySelector("nav");
      expect(nav?.textContent).toContain(t(locale, "nav.home"));
      expect(nav?.textContent).toContain(t(locale, "nav.services"));
      expect(nav?.textContent).toContain(t(locale, "nav.contact"));
      expect(container.innerHTML).toContain(t(locale, "brand.name"));
      unmount();
    }
  });
});
