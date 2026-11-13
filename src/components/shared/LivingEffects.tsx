/**
 * LivingEffects.tsx — count-up and reveal-on-scroll, as DOM enhancements.
 *
 * The reference implements both over the server-rendered markup
 * (پلتفرم/assets/js/main.js, "LIVING LAYER"): `[data-count]` numbers animate
 * from 0 when they enter the viewport, and a set of blocks fade/slide in on
 * first intersection. This island does the same, over the same kind of
 * server-rendered markup, so the page is complete and correct without it.
 *
 * Motion gating, exactly like the reference:
 *   - reduced motion → no `.fx` class, no count-up. CSS scopes all hidden
 *     initial states under `.fx`, so nothing is ever invisible without
 *     motion being allowed first.
 *
 * Count-up preserves the reference affix semantics: the number is found
 * inside the existing text (e.g. "+۶۰"), the pre/postfixes are kept, and the
 * digits are re-localized per the rendered `<html lang>`.
 */

"use client";

import { useEffect } from "react";

import { toAsciiDigits, toLocaleDigits } from "@/core/i18n/digits";
import type { Locale } from "@/core/i18n/locales";
import { isLocale } from "@/core/i18n/locales";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Easing + duration mirror the reference's count-up. */
const DURATION_UNDER_1000 = 1600;
const DURATION_OVER_1000 = 1400;

function pageLocale(): Locale {
  const lang = document.documentElement.lang;
  return isLocale(lang) ? lang : "fa";
}

/** Animate one [data-count] element (reference countUp, verbatim logic). */
function countUp(element: HTMLElement, locale: Locale) {
  const raw = (element.textContent ?? "").trim();
  const latin = toAsciiDigits(raw);
  const match = latin.match(/\d+/);
  if (match === null) return;

  const target = Number.parseInt(match[0], 10);
  const start = latin.indexOf(match[0]);
  const prefix = raw.slice(0, start);
  const suffix = raw.slice(start + match[0].length);

  const from = target > 1000 ? target - 40 : 0;
  const duration = target > 1000 ? DURATION_OVER_1000 : DURATION_UNDER_1000;
  let t0: number | null = null;

  const step = (t: number) => {
    if (t0 === null) t0 = t;
    const p = Math.min((t - t0) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    element.textContent = prefix + toLocaleDigits(locale, Math.round(from + (target - from) * eased)) + suffix;
    if (p < 1) window.requestAnimationFrame(step);
  };

  window.requestAnimationFrame(step);
}

export function LivingEffects() {
  const reduce = useReducedMotion();

  useEffect(() => {
    const root = document.documentElement;
    // Read the live query here, not just the hook state: `useReducedMotion`
    // starts at its SSR default (false) and syncs one tick after mount, so the
    // effect's first run would otherwise arm `.fx` for a frame even under
    // reduced motion — long enough for the reveal observers to fire and start
    // transitions the CSS reduced-motion rules would then have to undo.
    // The typeof guard mirrors the hook's: no matchMedia (SSR pass, very old
    // browsers, jsdom) keeps the default instead of throwing.
    const reduceNow =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || reduceNow) {
      root.classList.remove("fx");
      return;
    }
    root.classList.add("fx");

    const locale = pageLocale();

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 },
    );

    const countObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            countUp(entry.target as HTMLElement, locale);
            countObserver.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.6 },
    );

    document.querySelectorAll("[data-reveal]").forEach((element, i) => {
      // main.js: `el.style.transitionDelay = (i % 4) * 70 + "ms"` — the
      // quarter-group stagger of the reference's reveal sequence.
      (element as HTMLElement).style.transitionDelay = `${(i % 4) * 70}ms`;
      revealObserver.observe(element);
    });
    document.querySelectorAll("[data-count]").forEach((element) => countObserver.observe(element));
    return () => {
      revealObserver.disconnect();
      countObserver.disconnect();
    };
  }, [reduce]);

  return null;
}
