/**
 * useMediaQuery.ts — SSR-safe matchMedia hook.
 *
 * The living layer (P1-12) gates every effect on media features exactly as
 * the reference does: `prefers-reduced-motion: reduce` and `pointer: fine`.
 * During SSR and the first client render the hook returns `defaultValue`
 * (no `window`), so server-rendered HTML never depends on a media query and
 * there is no hydration mismatch.
 */

"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    // Environments without matchMedia (SSR pass, very old browsers) keep the
    // default rather than throwing — the default is what the server rendered.
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(query);
    const sync = () => setMatches(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, [query]);

  return matches;
}
