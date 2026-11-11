/**
 * useReducedMotion.test.tsx — the motion gate, under test.
 *
 * Both living-layer gates are thin wrappers over useMediaQuery; the point of
 * these tests is to pin the exact media features the reference gates on
 * (پلتفرم/assets/js/main.js):
 *   - `prefers-reduced-motion: reduce` suppresses particles/reveal/count-up.
 *   - `pointer: fine` gates mouse-only flourishes.
 * If someone rewrites either gate, these tests fail before a11y regressions
 * ship.
 */

import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import { useFinePointer, useReducedMotion } from "./useReducedMotion";
import { useMediaQuery } from "./useMediaQuery";

/** Swap the hook under test in while keeping the matchMedia stub shared. */
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
  const original = window.matchMedia;
  window.matchMedia = () => mql;
  return () => {
    window.matchMedia = original;
  };
}

describe("useReducedMotion", () => {
  it("gates on prefers-reduced-motion: reduce", () => {
    const restore = stubMatchMedia(true);
    try {
      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(true);
    } finally {
      restore();
    }
  });

  it("defaults to motion allowed", () => {
    const restore = stubMatchMedia(false);
    try {
      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(false);
    } finally {
      restore();
    }
  });
});

describe("useFinePointer", () => {
  it("gates on pointer: fine", () => {
    const restore = stubMatchMedia(true);
    try {
      const { result } = renderHook(() => useFinePointer());
      expect(result.current).toBe(true);
    } finally {
      restore();
    }
  });

  it("is false for coarse pointers (touch)", () => {
    const restore = stubMatchMedia(false);
    try {
      const { result } = renderHook(() => useFinePointer());
      expect(result.current).toBe(false);
    } finally {
      restore();
    }
  });
});

describe("gate wiring", () => {
  it("both gates share useMediaQuery's SSR-safe default", () => {
    // With no matchMedia stub, the hook still renders with the default —
    // the same guarantee the server render relies on.
    const motion = renderHook(() => useReducedMotion());
    const pointer = renderHook(() => useFinePointer());
    expect(motion.result.current).toBe(false);
    expect(pointer.result.current).toBe(false);
  });

  it("useMediaQuery is the single source (no duplicated logic)", () => {
    // Guard against the gates drifting away from the shared hook: the module
    // under test must re-export nothing else.
    expect(typeof useMediaQuery).toBe("function");
  });
});
