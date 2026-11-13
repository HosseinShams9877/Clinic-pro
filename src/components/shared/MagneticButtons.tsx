/**
 * MagneticButtons.tsx — the reference's magnetic primary buttons
 * (پلتفرم/assets/js/main.js, IIFE 2, "magnetic primary buttons"), as a
 * null-rendering client island.
 *
 * The reference, verbatim:
 *
 *   document.querySelectorAll(".hero .btn, .btn-primary").forEach(b => {
 *     b.classList.add("magnetic");
 *     b.addEventListener("mousemove", e => {
 *       var r = b.getBoundingClientRect();
 *       b.style.transform = "translate(" + ((e.clientX-r.left-r.width/2)*.18)
 *         + "px," + ((e.clientY-r.top-r.height/2)*.3) + "px)";
 *     });
 *     b.addEventListener("mouseleave", () => { b.style.transform = ""; });
 *   });
 *
 * Gating, verbatim: the whole living layer returns early under
 * `prefers-reduced-motion: reduce` (main.js reads the query before any of
 * it), and the mouse-only flourishes return early without
 * `pointer: fine`. Both gates are honored here — the hook state plus a live
 * re-read inside the effect (the same belt-and-braces LivingEffects uses,
 * because the hook starts at its SSR default and syncs one tick later).
 *
 * The selector is ported literally. The reference's `.hero` element exists
 * only on platform.html (out of scope); on index.html the effective match is
 * `.btn-primary` — the header CTA, the hero's primary CTA and the contact
 * strip. `magnetic` is the reference's own marker class (unstyled in
 * style.css, purely a flag); the smoothness of the follow comes from the
 * ported `.btn{transition:transform .25s var(--ease)}` in reference.css,
 * which is why the inline transform animates instead of jumping.
 *
 * The reference is a multi-page site, so it binds once per page load. The
 * app navigates client-side, so the effect re-runs per route change (the
 * pathname dependency) — and the cleanup detaches the listeners and clears
 * the inline transform on every button it armed, so a page's worth of stale
 * listeners can never survive a route transition.
 */

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useReducedMotion } from "@/hooks/useReducedMotion";

/** The reference's translation factors: x * .18, y * .3. */
const X_FACTOR = 0.18;
const Y_FACTOR = 0.3;

export function MagneticButtons() {
  const reduce = useReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    // main.js gating: `if (reduce) return;` opens the living layer, and
    // `if (!finePointer) return;` guards the mouse-only flourishes.
    if (reduce) return;
    if (typeof window.matchMedia === "function") {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (!window.matchMedia("(pointer: fine)").matches) return;
    } else {
      return; // no matchMedia (jsdom, very old browsers): never arm
    }

    const buttons = Array.from(
      document.querySelectorAll<HTMLElement>(".hero .btn, .btn-primary"),
    );

    const onMove = (event: MouseEvent) => {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      const x = ((event.clientX - rect.left - rect.width / 2) * X_FACTOR).toFixed(1);
      const y = ((event.clientY - rect.top - rect.height / 2) * Y_FACTOR).toFixed(1);
      button.style.transform = `translate(${x}px,${y}px)`;
    };

    const onLeave = (event: MouseEvent) => {
      (event.currentTarget as HTMLElement).style.transform = "";
    };

    for (const button of buttons) {
      button.classList.add("magnetic");
      button.addEventListener("mousemove", onMove);
      button.addEventListener("mouseleave", onLeave);
    }

    return () => {
      for (const button of buttons) {
        button.classList.remove("magnetic");
        button.removeEventListener("mousemove", onMove);
        button.removeEventListener("mouseleave", onLeave);
        button.style.transform = "";
      }
    };
  }, [reduce, pathname]);

  return null;
}
