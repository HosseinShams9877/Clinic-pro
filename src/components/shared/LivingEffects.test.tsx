/**
 * LivingEffects.test.tsx — the count-up + reveal island, under test.
 *
 * Contract (mirror of پلتفرم/assets/js/main.js, LIVING LAYER):
 *   1. With motion allowed: `<html>` gets `.fx` (the CSS-only initial hidden
 *      state for [data-reveal] is scoped under it), intersecting elements get
 *      `.in`, and [data-count] animates to its target in the page locale's
 *      digits — preserving the reference's affixes (e.g. "+۶۰" → "+60").
 *   2. With reduced motion: no `.fx` is left on `<html>`, nothing animates,
 *      and the server-rendered text is the final text.
 *
 * jsdom has no IntersectionObserver and no real matchMedia, so both are
 * stubbed; the count-up clock is driven by vitest's fake timers.
 */

import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LivingEffects } from "./LivingEffects";

type IOCallback = (entries: IntersectionObserverEntry[]) => void;

/** A minimal controllable IntersectionObserver stand-in. */
class FakeIntersectionObserver {
  private elements = new Set<Element>();
  static instances: FakeIntersectionObserver[] = [];
  constructor(private callback: IOCallback) {
    FakeIntersectionObserver.instances.push(this);
  }
  observe(element: Element) {
    this.elements.add(element);
  }
  unobserve(element: Element) {
    this.elements.delete(element);
  }
  disconnect() {
    this.elements.clear();
  }
  /** Fire the callback for every observed element (test-only trigger). */
  fire(isIntersecting: boolean) {
    const entries = [...this.elements].map((target) => ({ isIntersecting, target }));
    this.callback(entries as IntersectionObserverEntry[]);
  }
}

function stubMatchMedia(matches: boolean) {
  const mql = {
    matches,
    media: "",
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatch: () => {},
  } as unknown as MediaQueryList;
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = () => mql;
  return () => {
    window.matchMedia = originalMatchMedia;
  };
}

const originalIO = globalThis.IntersectionObserver;
const originalRAF = window.requestAnimationFrame;

/** Vitest's fake timers do not drive jsdom's real rAF; route it through the
 *  faked clock so advanceTimersByTime steps the animation frame by frame. */
function fakeRAF(callback: FrameRequestCallback): number {
  return window.setTimeout(() => callback(Date.now()), 16) as unknown as number;
}

describe("LivingEffects", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeIntersectionObserver.instances = [];
    globalThis.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
    window.requestAnimationFrame = fakeRAF;
    // The island reads the page locale off <html lang>; jsdom ships none, so
    // pin it explicitly (en → ASCII digits).
    document.documentElement.lang = "en";
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.IntersectionObserver = originalIO;
    window.requestAnimationFrame = originalRAF;
    document.documentElement.lang = "";
    document.documentElement.className = "";
    document.body.innerHTML = "";
  });

  it("sets .fx on <html> and reveals intersecting [data-reveal] elements", () => {
    const restore = stubMatchMedia(false);
    try {
      render(
        <div>
          <p data-reveal>reveal-me</p>
          <LivingEffects />
        </div>,
      );

      expect(document.documentElement.classList.contains("fx")).toBe(true);

      const revealObserver = FakeIntersectionObserver.instances[0]!
      act(() => {
        revealObserver.fire(true);
      });

      const paragraph = document.querySelector("[data-reveal]");
      expect(paragraph?.classList.contains("in")).toBe(true);
    } finally {
      restore();
    }
  });

  it("animates [data-count] to the target, keeping the reference affixes", () => {
    const restore = stubMatchMedia(false);
    try {
      render(
        <div>
          <b data-count="60">+۶۰</b>
          <LivingEffects />
        </div>,
      );

      const counter = document.querySelector("[data-count]") as HTMLElement;
      const countObserver = FakeIntersectionObserver.instances[1]!
      act(() => {
        countObserver.fire(true);
      });

      // The reference count-up runs 1600ms for targets ≤ 1000.
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // <html lang="en"> → ASCII digits; the "+" affix survives.
      expect(counter.textContent).toBe("+60");
    } finally {
      restore();
    }
  });

  it("re-localizes count-up digits for fa (Persian digits)", () => {
    const restore = stubMatchMedia(false);
    try {
      document.documentElement.lang = "fa";
      render(
        <div>
          <b data-count="7">۷</b>
          <LivingEffects />
        </div>,
      );

      const counter = document.querySelector("[data-count]") as HTMLElement;
      const countObserver = FakeIntersectionObserver.instances[1]!
      act(() => {
        countObserver.fire(true);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(counter.textContent).toBe("۷");
    } finally {
      restore();
    }
  });

  it("keeps the final value when the [data-count] text carries the target (no-JS parity)", () => {
    // Same markup, but the observer never fires — the server-rendered text
    // must remain the truth, which is what no-JS visitors see.
    const restore = stubMatchMedia(false);
    try {
      render(
        <div>
          <b data-count="7">۷</b>
          <LivingEffects />
        </div>,
      );

      expect(document.querySelector("[data-count]")?.textContent).toBe("۷");
    } finally {
      restore();
    }
  });

  it("suppresses everything under prefers-reduced-motion: no .fx, no reveal, no count-up", () => {
    const restore = stubMatchMedia(true);
    try {
      render(
        <div>
          <p data-reveal>reveal-me</p>
          <b data-count="60">+۶۰</b>
          <LivingEffects />
        </div>,
      );

      // The cleanup of the first (motion-allowed) effect run disconnects the
      // observers; the reduced-motion run leaves no .fx and no animation.
      expect(document.documentElement.classList.contains("fx")).toBe(false);

      act(() => {
        for (const observer of FakeIntersectionObserver.instances) {
          observer.fire(true);
        }
        vi.advanceTimersByTime(2000);
      });

      expect(document.querySelector("[data-reveal]")?.classList.contains("in")).toBe(false);
      expect(document.querySelector("[data-count]")?.textContent).toBe("+۶۰");
    } finally {
      restore();
    }
  });
});
