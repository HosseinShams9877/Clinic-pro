/**
 * focus-ring-clip.test.tsx — the focus-ring geometry gate (P2 item 6, 2026-11-10).
 *
 * The focus indicator is a 2px outline at offset 3px (5px extent beyond the
 * border box). `overflow: hidden` clips descendant painting at the ancestor's
 * padding box, so a focusable element inside an `overflow-hidden` ancestor
 * inset by less than 5px loses part of its ring — measured as 36 real failures
 * across four routes before the fix. The sub-menu and the language dropdown
 * carried `overflow-hidden` merely to keep their hover backgrounds inside the
 * rounded corners; the corner radius now lives on the first/last link instead.
 * A live CDP geometry probe (4 routes × 2 widths, fa/RTL) reported 0 failures
 * after this change; these tests pin the markup at the component level.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { SiteHeader } from "./SiteHeader";
import { LanguageSwitcher } from "./LanguageSwitcher";

const focusRuleCss = () =>
  readFileSync(join(process.cwd(), "src/styles/globalCss/typography.css"), "utf8");

const submenuLinks = (container: HTMLElement): [HTMLAnchorElement, HTMLAnchorElement] => {
  const surgical = container.querySelector('a[href="/services#surgical"]');
  const medical = container.querySelector('a[href="/services#medical"]');
  if (!surgical || !medical) throw new Error("sub-menu links missing from SiteHeader");
  return [surgical as HTMLAnchorElement, medical as HTMLAnchorElement];
};

describe("SiteHeader services sub-menu", () => {
  it("clips no link's focus ring — no overflow-hidden anywhere up the subtree", () => {
    const { container } = render(<SiteHeader locale="fa" />);
    for (const link of submenuLinks(container)) {
      for (let n: Element | null = link.parentElement; n && n !== document.body; n = n.parentElement) {
        expect(n.className ?? "", "an ancestor clips the focus ring").not.toMatch(/overflow-hidden/);
      }
    }
  });

  it("keeps the rounded corners on the first/last link instead", () => {
    const { container } = render(<SiteHeader locale="fa" />);
    const [surgical, medical] = submenuLinks(container);
    expect(surgical.className).toMatch(/rounded-t-lg/);
    expect(medical.className).toMatch(/rounded-b-lg/);
    const item = surgical.closest("li");
    expect(item?.className).toMatch(/rounded-lg/);
  });
});

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("LanguageSwitcher dropdown", () => {
  it("clips no menuitem's focus ring — no overflow-hidden on the menu", () => {
    render(<LanguageSwitcher locale="fa" />);
    fireEvent.click(screen.getByRole("button", { name: /زبان|language/i }));
    const menu = screen.getByRole("menu");
    expect(menu.className).not.toMatch(/overflow-hidden/);
    const items = screen.getAllByRole("menuitem");
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.className).not.toMatch(/overflow-hidden/);
    }
  });

  it("carries the corner radius on the first/last menuitem", () => {
    render(<LanguageSwitcher locale="fa" />);
    fireEvent.click(screen.getByRole("button", { name: /زبان|language/i }));
    const items = screen.getAllByRole("menuitem");
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) throw new Error("language dropdown menuitems missing");
    expect(first.className).toMatch(/rounded-t-lg/);
    expect(last.className).toMatch(/rounded-b-lg/);
  });
});

describe("the focus indicator's own geometry", () => {
  it("uses a 2px outline at 3px offset (the 5px extent the tests assume)", () => {
    const css = focusRuleCss();
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px/);
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline-offset:\s*3px/);
  });
});
