/**
 * useReducedMotion.ts — the `prefers-reduced-motion: reduce` gate.
 *
 * Mirrors the reference's living layer (پلتفرم/assets/js/main.js:
 * `var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches`)
 * — everything decorative (particles, reveal transitions, count-up) is
 * suppressed when the user asks for reduced motion. Content is unaffected:
 * it is all server-rendered.
 */

"use client";

import { useMediaQuery } from "./useMediaQuery";

export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)", false);
}

/** `pointer: fine` — the reference gating for mouse-only flourishes. */
export function useFinePointer(): boolean {
  return useMediaQuery("(pointer: fine)", false);
}
