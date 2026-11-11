/**
 * ScrollProgress.tsx — the reading-progress bar (reference `.scroll-progress`).
 *
 * Pure indicator: the reference updates it regardless of reduced-motion
 * (it reflects scroll position, it does not animate on its own), so this
 * island has no motion gate. The bar is `aria-hidden` — it carries no
 * information for assistive technology.
 */

"use client";

import { useEffect } from "react";

export function ScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById("scroll-progress");
    if (bar === null) return;

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty("--sp", max > 0 ? (window.scrollY / max).toFixed(4) : "0");
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return <div id="scroll-progress" className="scroll-progress" aria-hidden="true" />;
}
