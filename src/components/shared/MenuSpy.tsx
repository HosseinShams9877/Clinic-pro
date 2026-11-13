/**
 * MenuSpy.tsx — the reference's "Active menu link on scroll" behavior
 * (پلتفرم/assets/js/main.js, IIFE 1), as a null-rendering client island.
 *
 * What the reference actually does (and this ports verbatim):
 *
 *   var links = menu.querySelectorAll('a[href^="#"]');
 *   …map each to its target element…
 *   function spy() {
 *     var mid = window.innerHeight * 0.45, cur = null;
 *     …cur = the link whose target straddles the mid-line…
 *     if (!cur && window.scrollY < 300) cur = the "#top" link;
 *     links.forEach(l => l.classList.toggle("active", l === cur));
 *   }
 *
 * The `a[href^="#"]` selector is the artifact of a file-based site: it only
 * matches same-page hash links, and those only exist in the reference's menu
 * on index.html (inner pages use fully-qualified `index.html#contact`-style
 * hrefs). So the scroll-spy is a **home-page behavior** in the reference, and
 * it stays one here: on every other route this island arms nothing, exactly
 * like services.html where the selector matches no link. The active state of
 * a current-section link on inner pages is a static, server-rendered one in
 * the reference (services.html L77: `class="active" aria-current="page"`),
 * which SiteHeader now bakes in from the route.
 *
 * On the home route the two reference rules apply unchanged:
 *   - a menu link whose hash target straddles the mid-screen line
 *     (innerHeight * 0.45) is the active one;
 *   - with no section at the mid-line and scrollY < 300, the home link
 *     (the reference's `#top`) is active.
 *
 * Not motion-gated, in either site: it reflects scroll position, it does not
 * animate (same call as the reference, and as our ScrollProgress port).
 */

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { ROUTES } from "@/config/site.config";

/** The mid-screen line, as a fraction of the viewport (reference: 0.45). */
const MID_FRACTION = 0.45;
/** Below this scroll offset the "top" link wins (reference: 300). */
const TOP_THRESHOLD = 300;

export function MenuSpy() {
  const pathname = usePathname();

  useEffect(() => {
    // Inner pages: the reference's selector finds nothing, so the spy is
    // inert — and it must not touch the server-rendered current-section
    // `active` class either.
    if (pathname !== ROUTES.home) return;

    const menu = document.getElementById("menu");
    if (!menu) return;

    const links = Array.from(menu.querySelectorAll<HTMLAnchorElement>("a"));
    // The app's hash link is path-qualified (`/#contact`), so the hash is
    // parsed out of the attribute rather than sliced off position 0 — the
    // same "does this link target a section on this page" question the
    // reference's `a[href^="#"]` selector asks.
    const targets = links
      .map((link) => {
        const hash = (link.getAttribute("href") ?? "").split("#")[1] ?? "";
        return { link, el: hash ? document.getElementById(hash) : null };
      })
      // The reference maps `#top` to `null` explicitly — the top link never
      // has a section target; it wins only through the scrollY < 300 rule.
      .filter((target) => target.el !== null);
    const top = links.find((link) => link.getAttribute("href") === ROUTES.home);

    const spy = () => {
      const mid = window.innerHeight * MID_FRACTION;
      let cur: HTMLAnchorElement | null = null;
      for (const target of targets) {
        const rect = (target.el as HTMLElement).getBoundingClientRect();
        if (rect.top <= mid && rect.bottom > mid) cur = target.link;
      }
      if (!cur && window.scrollY < TOP_THRESHOLD) cur = top ?? null;
      for (const link of links) link.classList.toggle("active", link === cur);
    };

    window.addEventListener("scroll", spy, { passive: true });
    window.addEventListener("resize", spy);
    spy();
    return () => {
      window.removeEventListener("scroll", spy);
      window.removeEventListener("resize", spy);
    };
  }, [pathname]);

  return null;
}
