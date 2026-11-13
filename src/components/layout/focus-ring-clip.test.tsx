/**
 * focus-ring-clip.test.tsx — the focus-ring geometry gate (P2 item 6, 2026-11-10).
 *
 * The focus indicator is a 2px outline at offset 3px (5px extent beyond the
 * border box). `overflow: hidden` clips descendant painting at the ancestor's
 * padding box, so a focusable element inside an `overflow-hidden` ancestor
 * inset by less than 5px loses part of its ring — measured as 36 real failures
 * across four routes before the fix. The sub-menu and the language dropdown
 * carried `overflow-hidden` merely to keep their hover backgrounds inside the
 * rounded corners; the corner radius then lived on the first/last link.
 * A live CDP geometry probe (4 routes × 2 widths, fa/RTL) reported 0 failures
 * after that change.
 *
 * Visual fidelity pass (B-1, 2026-11-11) refreeze: the dropdowns are now the
 * reference's own geometry (style.css L798-815 / L115-119), ported into
 * reference.css: the panels keep `padding:8px|6px` + their own radius
 * (16px / 14px) and each item carries its own `border-radius:10px`, so no
 * ancestor clipping is needed at all. The tests now pin the invariant in
 * that form: the ported panel rules must not clip (no `overflow:hidden`),
 * and nothing in the rendered markup may reintroduce a Tailwind overflow or
 * radius utility that would fight the ported geometry. Justification
 * recorded in docs/reports/PHASE_2_BASELINE.md §"Refreeze record".
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { SiteHeader } from "./SiteHeader";
import { LanguageSwitcher } from "./LanguageSwitcher";

const focusRuleCss = () =>
  readFileSync(join(process.cwd(), "src/styles/globalCss/typography.css"), "utf8");

const portedCss = () =>
  readFileSync(join(process.cwd(), "src/styles/globalCss/reference.css"), "utf8");

/** Extract a single rule body from the ported stylesheet (rules are one line). */
const ruleBody = (css: string, selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\{([^}]*)\\}`))?.[1] ?? "";
};

const expectNoClip = (selector: string) => {
  const body = ruleBody(portedCss(), selector);
  expect(body, `${selector} missing from the ported dropdown rules`).toBeTruthy();
  expect(body, `${selector} would clip a focus ring`).not.toMatch(/overflow:\s*hidden/);
};

const submenuLinks = (container: HTMLElement): [HTMLAnchorElement, HTMLAnchorElement] => {
  const surgical = container.querySelector('a[href="/services#surgical"]');
  const medical = container.querySelector('a[href="/services#medical"]');
  if (!surgical || !medical) throw new Error("sub-menu links missing from SiteHeader");
  return [surgical as HTMLAnchorElement, medical as HTMLAnchorElement];
};

describe("SiteHeader services sub-menu", () => {
  it("clips no link's focus ring — no overflow-hidden anywhere up the subtree", () => {
    const { container } = render(<SiteHeader locale="fa" pathname="/" />);
    for (const link of submenuLinks(container)) {
      for (let n: Element | null = link.parentElement; n && n !== document.body; n = n.parentElement) {
        expect(n.className ?? "", "an ancestor clips the focus ring").not.toMatch(/overflow-hidden/);
      }
    }
  });

  it("rounds each item itself (reference geometry) — no clipping utility anywhere", () => {
    const { container } = render(<SiteHeader locale="fa" pathname="/" />);
    const [surgical, medical] = submenuLinks(container);
    // No Tailwind overflow/radius utility may fight the ported `.menu .sub a`
    // rule (items are border-radius:10px; the panel is 16px with padding:8px).
    for (const link of [surgical, medical]) {
      expect(link.className).not.toMatch(/overflow-hidden|rounded-/);
      expect(link.closest("li")?.className ?? "").not.toMatch(/overflow-hidden|rounded-/);
    }
    const css = portedCss();
    expect(css).toMatch(/\.menu \.sub a\{[^}]*border-radius:10px/);
    expect(css).toMatch(/\.menu \.sub\{[^}]*border-radius:16px/);
    expectNoClip(".menu .sub");
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

  it("rounds each item itself (reference geometry) — no clipping utility anywhere", () => {
    render(<LanguageSwitcher locale="fa" />);
    fireEvent.click(screen.getByRole("button", { name: /زبان|language/i }));
    const items = screen.getAllByRole("menuitem");
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) throw new Error("language dropdown menuitems missing");
    for (const item of [first, last]) {
      expect(item.className).not.toMatch(/overflow-hidden|rounded-/);
    }
    const css = portedCss();
    expect(css).toMatch(/\.lang-list button,\.lang-list a\{[^}]*border-radius:10px/);
    expect(css).toMatch(/\.lang-list\{[^}]*border-radius:14px/);
    expectNoClip(".lang-list");
  });
});

describe("the focus indicator's own geometry", () => {
  it("uses a 2px outline at 3px offset (the 5px extent the tests assume)", () => {
    const css = focusRuleCss();
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px/);
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline-offset:\s*3px/);
  });
});
