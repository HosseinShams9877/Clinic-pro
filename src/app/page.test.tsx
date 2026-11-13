/**
 * page.test.tsx — the home page render gates (P1-09 / P1-11 / P1-12).
 *
 * The page is rendered as a server component (the component function is
 * awaited, exactly as the App Router would), with next/headers mocked so the
 * locale resolves deterministically. The assertions pin the boundary:
 *   - the eight static services cards link only into the built catalog, and
 *     so does every services link the mounted bento island adds,
 *   - the loan (ln.*) and loyalty club (cb.*) sections of the reference are
 *     nowhere in the markup — not their Persian strings, not their anchors,
 *   - the live badge paints its server snapshot before any fetch resolves
 *     (this is the "HTML without JS is complete" gate),
 *   - stats and contact text are present as final text, not client-ified.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";

import { makeQueryClient } from "@/core/query/client";
import { statusFor } from "@/core/openHours";
import { statusText } from "@/modules/services/queries/statusQueries";
import { LOCALES } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";

/** The locale the mocked next/headers will resolve. */
let mockedLocale: "fa" | "en" | "ar" | undefined;

vi.mock("next/headers", () => ({
  cookies: () => ({ get: () => undefined }),
  headers: () => ({ get: () => mockedLocale && `xx, ${mockedLocale};q=1` }),
}));

const { default: HomePage } = await import("./page");

/** Render the (async) page as the router would, inside the client provider tree. */
async function renderHome() {
  const page = (await (HomePage as () => Promise<ReactNode>)()) as ReactNode;
  const queryClient = makeQueryClient();
  return render(<QueryClientProvider client={queryClient}>{page}</QueryClientProvider>);
}

const ORIGINAL_FETCH = globalThis.fetch;

beforeEach(() => {
  // The badge's own island must never hit the network in these tests: an
  // unresolved promise keeps it on the server snapshot, which is the no-JS
  // state the page ships.
  globalThis.fetch = vi.fn(() => new Promise<Response>(() => {}));
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  vi.restoreAllMocks();
});

describe("home page (fa)", () => {
  beforeEach(() => {
    mockedLocale = "fa";
  });

  it("renders the hero, the stats and the contact strip as plain text", async () => {
    await renderHome();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(t("fa", "h.t1"));
    // The three verified stats — text is the final value, no JS needed.
    // (Scoped to the stats list: the mounted services-bento island renders
    // its own group counters in the same document, e.g. em.hx-n "۷".)
    const stats = within(document.querySelector(".h-stats") as HTMLElement);
    expect(stats.getByText(t("fa", "st.n1"))).toBeInTheDocument();
    expect(stats.getByText(t("fa", "st.l1"))).toBeInTheDocument();
    // Contact strip keeps its tel link (the booking CTA dials the same
    // number per Q1 — also a tel: anchor, not an out-of-scope page).
    const tel = document.querySelector('a[href^="tel:"]');
    expect(tel).not.toBeNull();
  });

  it("renders the eight static services cards, and every services link (including the mounted bento island) stays inside the built catalog", async () => {
    await renderHome();
    // The no-JS/SEO fallback grid: the reference's own eight cards, c1–c8.
    const fallback = document.querySelector(".h-svc");
    expect(fallback).not.toBeNull();
    const fallbackHrefs = [...(fallback?.querySelectorAll("a") ?? [])].map((link) =>
      link.getAttribute("href"),
    );
    expect(fallbackHrefs).toHaveLength(8);
    for (const href of fallbackHrefs) {
      expect(href).toMatch(/^\/services\/(gen|gyn|uro|ortho|plastic|aes|eye|ent|endo|anes)$/);
    }
    // The mounted HomeSvcBento island (home-svc.js) renders the active tab's
    // cards as real anchors too — none of them may leave the catalog either.
    const allHrefs = [...document.querySelectorAll('a[href^="/services/"]')].map((link) =>
      link.getAttribute("href"),
    );
    expect(allHrefs.length).toBeGreaterThanOrEqual(8);
    for (const href of allHrefs) {
      expect(href).toMatch(/^\/services\/(gen|gyn|uro|ortho|plastic|aes|eye|ent|endo|anes)$/);
    }
  });

  it("ships no loan (ln.*) and no loyalty club (cb.*) content anywhere in the markup", async () => {
    const { container } = await renderHome();
    const html = container.innerHTML;
    // The reference's own Persian strings for those two sections.
    expect(html).not.toContain("وام درمانی");
    expect(html).not.toContain("باشگاه");
    expect(html).not.toContain("کارت عضویت");
    expect(html).not.toContain("عضویت");
    // And none of their anchors.
    expect(html).not.toContain("loan.html");
    expect(html).not.toContain("club");
    // No i18n key leaks either.
    expect(html).not.toMatch(/\b(ln|cb)\./);
  });

  it("renders no doctors section — doctor pages are past the boundary", async () => {
    const { container } = await renderHome();
    const html = container.innerHTML;
    expect(html).not.toContain("پزشکان این بخش");
    expect(html).not.toContain("doctors.html");
    expect(html).not.toContain("تیم پزشکی");
  });

  it("paints the live badge's server snapshot before any fetch resolves", async () => {
    // Pin the clock so the snapshot computed inside the page and the one
    // asserted here see the same instant: Wed 2026-11-04 10:00 Tehran = open.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 10, 4, 6, 30)));
    try {
      await renderHome();
      const badge = screen.getByRole("status");
      const { title, sub } = statusText("fa", statusFor());
      expect(badge).toHaveTextContent(title);
      expect(badge).toHaveTextContent(sub);
    } finally {
      vi.useRealTimers();
    }
  });

  it("emits the WebSite structured data and no SearchAction", async () => {
    const { container } = await renderHome();
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    const documents = [...scripts].map((node) => JSON.parse(node.textContent ?? "{}"));
    const website = documents.find((document) => document["@type"] === "WebSite");
    expect(website).toBeDefined();
    expect(website).not.toHaveProperty("potentialAction");
  });
});

describe("home page in every locale", () => {
  it.each(LOCALES)("renders localized (lang=%s)", async (locale) => {
    mockedLocale = locale;
    const { container } = await renderHome();
    expect(container.querySelector("main") ?? container).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(t(locale, "h.t1"));
  });
});
