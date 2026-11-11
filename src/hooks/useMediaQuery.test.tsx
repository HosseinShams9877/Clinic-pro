/**
 * useMediaQuery.test.tsx — the SSR-safe matchMedia gate, under test.
 *
 * The living layer (P1-12) gates every effect on media features exactly as
 * the reference does. Contract under test here:
 *   1. SSR/first render returns the default (no `window` access, no
 *      hydration mismatch against server HTML).
 *   2. The hook reflects `mql.matches` after mount.
 *   3. It follows `change` events (toggling the media later re-renders).
 *   4. Unmount removes the listener (no leaks, no setState on dead hook).
 */

import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useMediaQuery } from "./useMediaQuery";

/** jsdom does not implement matchMedia — install a controllable stub. */
function stubMatchMedia(initial: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let matches = initial;
  const mql = {
    get matches() {
      return matches;
    },
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatch: () => {},
  } as unknown as MediaQueryList;

  const original = window.matchMedia;
  window.matchMedia = () => mql;

  return {
    setMatches(value: boolean) {
      matches = value;
      for (const listener of listeners) {
        listener({ matches: value } as MediaQueryListEvent);
      }
    },
    restore() {
      window.matchMedia = original;
    },
    listenerCount: () => listeners.size,
  };
}

describe("useMediaQuery", () => {
  it("returns the default value on first render (SSR-safe)", () => {
    const { result } = renderHook(() => useMediaQuery("(prefers-reduced-motion: reduce)", false));
    expect(result.current).toBe(false);
  });

  it("reflects mql.matches after mount", () => {
    const media = stubMatchMedia(true);
    try {
      const { result } = renderHook(() => useMediaQuery("(prefers-reduced-motion: reduce)", false));
      expect(result.current).toBe(true);
    } finally {
      media.restore();
    }
  });

  it("keeps the default when matchMedia is unavailable (SSR / legacy)", () => {
    const original = window.matchMedia;
    // @ts-expect-error — deliberately absent, as in a no-matchMedia env.
    delete window.matchMedia;
    try {
      const { result } = renderHook(() => useMediaQuery("(pointer: fine)", true));
      expect(result.current).toBe(true);
    } finally {
      window.matchMedia = original;
    }
  });

  it("follows change events on the same query", () => {
    const media = stubMatchMedia(false);
    try {
      const { result } = renderHook(() => useMediaQuery("(prefers-reduced-motion: reduce)", false));
      expect(result.current).toBe(false);
      act(() => media.setMatches(true));
      expect(result.current).toBe(true);
      act(() => media.setMatches(false));
      expect(result.current).toBe(false);
    } finally {
      media.restore();
    }
  });

  it("removes its listener on unmount", () => {
    const media = stubMatchMedia(false);
    try {
      const { unmount } = renderHook(() => useMediaQuery("(prefers-reduced-motion: reduce)", false));
      expect(media.listenerCount()).toBe(1);
      unmount();
      expect(media.listenerCount()).toBe(0);
      // No setState after unmount — must not throw.
      act(() => media.setMatches(true));
    } finally {
      media.restore();
    }
  });
});
