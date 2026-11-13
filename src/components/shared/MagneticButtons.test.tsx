/**
 * MagneticButtons.test.tsx — the magnetic primary buttons island (B-6).
 *
 * Contract (mirror of پلتفرم/assets/js/main.js, IIFE 2): with a fine pointer
 * and motion allowed, every `.hero .btn` / `.btn-primary` gets the reference's
 * `magnetic` marker and follows the cursor
 * (translate((x - cx) * .18, (y - cy) * .3), read off the button's own rect)
 * until mouseleave clears the inline transform. Under reduced motion or a
 * coarse pointer nothing is armed — the reference's own two gates.
 *
 * jsdom has no real matchMedia and no layout: matchMedia is stubbed per test
 * (per query, so the two gates can be set independently) and the button
 * rects are jsdom's zeros (0,0,0,0), so the math is deterministic:
 * x = clientX * .18, y = clientY * .3, each toFixed(1).
 */

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MagneticButtons } from "./MagneticButtons";

const { pathname } = vi.hoisted(() => ({ pathname: { current: "/" } }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

const REDUCE = "(prefers-reduced-motion: reduce)";
const FINE = "(pointer: fine)";

/** Stub matchMedia with per-query answers (default false for unlisted). */
function stubMatchMedia(answers: Record<string, boolean>) {
  const make = (query: string, matches: boolean) =>
    ({
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatch: () => {},
    }) as unknown as MediaQueryList;
  const original = window.matchMedia;
  window.matchMedia = (query: string) => make(query, answers[query] ?? false);
  return () => {
    window.matchMedia = original;
  };
}

function fixture() {
  document.body.innerHTML = `
    <a class="btn btn-primary" href="tel:+983155154000">book</a>
    <a class="btn btn-line" href="/services">line</a>
  `;
}

const primary = () => document.querySelector(".btn-primary") as HTMLElement;

describe("MagneticButtons", () => {
  beforeEach(() => {
    pathname.current = "/";
    fixture();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("arms only the reference's targets and follows the cursor (fine pointer, motion allowed)", () => {
    const restore = stubMatchMedia({ [REDUCE]: false, [FINE]: true });
    try {
      render(<MagneticButtons />);

      expect(primary().classList.contains("magnetic")).toBe(true);
      // The line button is not `.hero .btn` nor `.btn-primary` — not armed.
      expect(document.querySelector(".btn-line")?.classList.contains("magnetic")).toBe(false);

      fireEvent.mouseMove(primary(), { clientX: 100, clientY: 50 });
      // jsdom zeros the rect: (100 - 0 - 0) * .18 = 18.0 ; 50 * .3 = 15.0.
      expect(primary().style.transform).toBe("translate(18.0px,15.0px)");

      fireEvent.mouseLeave(primary());
      expect(primary().style.transform).toBe("");
    } finally {
      restore();
    }
  });

  it("never arms under prefers-reduced-motion (the reference's living-layer gate)", () => {
    const restore = stubMatchMedia({ [REDUCE]: true, [FINE]: true });
    try {
      render(<MagneticButtons />);
      fireEvent.mouseMove(primary(), { clientX: 100, clientY: 50 });

      expect(primary().classList.contains("magnetic")).toBe(false);
      expect(primary().style.transform).toBe("");
    } finally {
      restore();
    }
  });

  it("never arms without pointer: fine (the reference's mouse-only gate)", () => {
    const restore = stubMatchMedia({ [REDUCE]: false, [FINE]: false });
    try {
      render(<MagneticButtons />);
      fireEvent.mouseMove(primary(), { clientX: 100, clientY: 50 });

      expect(primary().classList.contains("magnetic")).toBe(false);
      expect(primary().style.transform).toBe("");
    } finally {
      restore();
    }
  });

  it("re-arms per route change and disarms on unmount (no stale listeners)", () => {
    const restore = stubMatchMedia({ [REDUCE]: false, [FINE]: true });
    try {
      const { unmount } = render(<MagneticButtons />);
      expect(primary().classList.contains("magnetic")).toBe(true);

      pathname.current = "/services";
      render(<MagneticButtons />); // re-run on the new route
      expect(primary().classList.contains("magnetic")).toBe(true);

      fireEvent.mouseMove(primary(), { clientX: 100, clientY: 50 });
      expect(primary().style.transform).toBe("translate(18.0px,15.0px)");

      unmount();
      expect(primary().classList.contains("magnetic")).toBe(false);
      expect(primary().style.transform).toBe("");
    } finally {
      restore();
    }
  });
});
