/**
 * not-found.test.tsx — the 404 page render gates (Phase 2, item 4).
 *
 * The 404 is a real page, not a stub, so it is gated like one: rendered as the
 * router would (the async page awaited inside the client provider tree,
 * next/headers mocked), it asserts:
 *   - the localized title, body and both recovery links appear in every locale,
 *   - no other locale's text leaks into the page,
 *   - the only outbound anchors are home and /services (the implemented scope),
 *   - there is exactly one h1 and no hardcoded English survives.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";

import { makeQueryClient } from "@/core/query/client";
import { LOCALES } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";

/** The locale the mocked next/headers will resolve. */
let mockedLocale: "fa" | "en" | "ar" | undefined;

vi.mock("next/headers", () => ({
  cookies: () => ({ get: () => undefined }),
  headers: () => ({ get: () => mockedLocale && `xx, ${mockedLocale};q=1` }),
}));

const { default: NotFound } = await import("./not-found");

/** Render the (async) 404 page as the router would, inside the provider tree. */
async function renderNotFound() {
  const page = (await (NotFound as () => Promise<ReactNode>)()) as ReactNode;
  const queryClient = makeQueryClient();
  return render(<QueryClientProvider client={queryClient}>{page}</QueryClientProvider>);
}

const ORIGINAL_FETCH = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = vi.fn(() => new Promise<Response>(() => {}));
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  vi.restoreAllMocks();
});

describe("the global 404 page", () => {
  it("renders the localized title, body and recovery links in every locale", async () => {
    for (const locale of LOCALES) {
      mockedLocale = locale;
      const { container, unmount } = await renderNotFound();
      expect(container.querySelector("h1")).toHaveTextContent(t(locale, "err.notFoundTitle"));
      expect(container.textContent).toContain(t(locale, "err.notFoundBody"));
      expect(container.textContent).toContain(t(locale, "nav.home"));
      expect(container.textContent).toContain(t(locale, "nav.services"));
      // The other two locales must not leak into this locale's 404.
      for (const other of LOCALES.filter((value) => value !== locale)) {
        expect(container.textContent).not.toContain(t(other, "err.notFoundTitle"));
        expect(container.textContent).not.toContain(t(other, "err.notFoundBody"));
      }
      unmount();
    }
    mockedLocale = undefined;
  });

  it("links only to home and the services landing — the implemented scope", async () => {
    const { container } = await renderNotFound();
    const hrefs = [...container.querySelectorAll("a[href]")].map((node) => node.getAttribute("href"));
    expect(hrefs).toHaveLength(2);
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/services");
  });

  it("carries exactly one h1 and no hardcoded English fallback", async () => {
    mockedLocale = "fa";
    const { container } = await renderNotFound();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    // "404" is the only non-translated text on the page; the rest is fa.
    expect(container.textContent).not.toMatch(/Page not found|Something went wrong/);
    mockedLocale = undefined;
  });

  it("declares fa-canonical metadata for the missing page", async () => {
    const { metadata } = await import("./not-found");
    expect(metadata.title).toBe(t("fa", "err.notFoundTitle"));
    expect(metadata.description).toBe(t("fa", "err.notFoundBody"));
  });
});
