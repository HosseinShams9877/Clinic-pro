/**
 * HeroParallax.tsx — the reference's gentle hero-photo parallax (home.js).
 *
 * Null-rendering client island: it owns no markup, only the scroll listener
 * that nudges the hero photo's `--hy` custom property (consumed by
 * `.h-img img{transform:translateY(var(--hy,0)) scale(1.06)}` in
 * reference.css). The reference applies it only on wide screens
 * (min-width: 961px) and only when the user has not asked for reduced
 * motion — both gates are mirrored here.
 *
 * Progressive enhancement: without this island the hero photo is simply
 * static, exactly as the reference degrades.
 */

"use client";

import { useEffect } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";

/** The reference clamps the effect to the first 700px of scroll. */
const MAX_SCROLL = 700;
/** home.js: `img.style.setProperty("--hy", (scrollY * 0.12).toFixed(1) + "px")`. */
const FACTOR = 0.12;

export function HeroParallax() {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return; // prefers-reduced-motion: no parallax (home.js gate)
    // The typeof guard mirrors the living layer's: no matchMedia (SSR pass,
    // very old browsers, jsdom) means no parallax — the photo stays static.
    if (typeof window.matchMedia !== "function") return;
    const wide = window.matchMedia("(min-width: 961px)");
    if (!wide.matches) return; // mobile layout: the photo is not parallaxed

    const img = document.querySelector<HTMLImageElement>(".h-img img");
    if (!img) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      if (window.scrollY < MAX_SCROLL) {
        img.style.setProperty("--hy", `${(window.scrollY * FACTOR).toFixed(1)}px`);
      }
    };
    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [reduce]);

  return null;
}
