/**
 * LanguageSwitcher.test.tsx — B-1 regression: the switch must stay server-side.
 *
 * Observed bug: clicking a locale option updated the URL and the `lang` cookie
 * and re-rendered the route segment, but the root layout did not re-execute —
 * `<html lang>`, `<html dir>`, the header nav labels and the switcher's own
 * label stayed at the previous locale while the page content flipped (en text
 * under dir="rtl", switcher still reading "FA"). Cause: the menu items were
 * next/link `<Link>`s, so a `?lang=` change was a client-side searchParams-only
 * navigation instead of a document navigation.
 *
 * This test pins the fix from two sides:
 *   1. href shape — every menu item is a native anchor whose href carries
 *      `?lang=<locale>` for all three locales, built from the current pathname
 *      (so the pipeline `?lang=` → cookie → server `<html lang dir>` render is
 *      what actually runs on click);
 *   2. no client routing — the Next router's push is never called on click. If
 *      a menu item is ever converted back to `<Link>` from next/link, its
 *      click invokes router.push and this test fails.
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { LOCALES } from "@/core/i18n/locales";

const { pushCalls, router } = vi.hoisted(() => {
  const pushCalls: string[] = [];
  return {
    pushCalls,
    router: {
      push: (url: string) => pushCalls.push(url),
      replace: () => undefined,
      prefetch: () => undefined,
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/services/gyn",
  useRouter: () => router,
}));

import { LanguageSwitcher } from "./LanguageSwitcher";

describe("LanguageSwitcher (B-1)", () => {
  it("offers every locale as a native ?lang= anchor anchored to the current path", () => {
    render(<LanguageSwitcher locale="fa" />);

    fireEvent.click(screen.getByRole("button"));

    const items = screen.getAllByRole("menuitem");
    expect(items).toHaveLength(LOCALES.length);
    for (const item of items) {
      expect(item.tagName).toBe("A");
    }
    // Sorted by the LOCALES order: fa, en, ar.
    expect(items.map((item) => item.getAttribute("href"))).toEqual([
      "/services/gyn?lang=fa",
      "/services/gyn?lang=en",
      "/services/gyn?lang=ar",
    ]);
  });

  it("marks the active locale and closes the menu on selection", () => {
    render(<LanguageSwitcher locale="fa" />);

    fireEvent.click(screen.getByRole("button"));
    const items = screen.getAllByRole("menuitem");
    const active = items.find((item) => item.getAttribute("aria-current") === "true");
    const inactive = items.find((item) => item.getAttribute("aria-current") !== "true");
    expect(active?.getAttribute("href")).toBe("/services/gyn?lang=fa");
    expect(inactive?.getAttribute("aria-current")).toBeNull();

    fireEvent.click(inactive ?? document.body);

    expect(screen.queryAllByRole("menuitem")).toHaveLength(0);
  });

  it("never routes client-side: a menu-item click is a document navigation", () => {
    render(<LanguageSwitcher locale="fa" />);

    fireEvent.click(screen.getByRole("button"));
    const en = screen.getByRole("menuitem", { name: /English/ });
    fireEvent.click(en);
    // jsdom logs "Not implemented: navigation" rather than performing it — the
    // click really did ask the document to navigate to /services/gyn?lang=en.

    // The decisive B-1 assertion: next/link would have pushed the URL through
    // the client router here, leaving <html lang dir> stale.
    expect(pushCalls).toEqual([]);
  });
});
