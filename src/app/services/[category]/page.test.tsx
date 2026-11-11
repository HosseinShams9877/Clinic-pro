/**
 * page.test.tsx — the /services/[category] render gates (P1-10 / P1-12 / P1-14).
 *
 * Renders the async detail page as the router would (params awaited, the page
 * awaited, next/headers mocked) for a representative category in all three
 * locales, and pins:
 *   - the localized name/description and every benefit and item text appears,
 *   - the visible breadcrumb mirrors the BreadcrumbList JSON-LD (the P1-14
 *     "JSON-LD validated" gate applied to real page markup),
 *   - the Service JSON-LD names the category in the page's own locale,
 *   - the only outbound anchors are the in-scope nav links and tel:,
 *   - an unknown id renders nothing (notFound) instead of a broken page.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import { makeQueryClient } from "@/core/query/client";
import { LOCALES } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { getLocalizedCategory } from "@/modules/services/services";
import { SERVICE_CATEGORY_ORDER } from "@/modules/services/constants";
import { siteConfig } from "@/config/site.config";

/** The locale the mocked next/headers will resolve. */
let mockedLocale: "fa" | "en" | "ar" | undefined;

vi.mock("next/headers", () => ({
  cookies: () => ({ get: () => undefined }),
  headers: () => ({ get: () => mockedLocale && `xx, ${mockedLocale};q=1` }),
}));

const { default: CategoryPage } = await import("./page");

/** Render the (async) page as the router would, inside the client provider tree. */
async function renderCategory(id: string) {
  const page = (await CategoryPage({ params: Promise.resolve({ category: id }) })) as ReactNode;
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

/** The JSON-LD documents the page actually emitted, parsed. */
function jsonLdDocuments(container: HTMLElement) {
  return [...container.querySelectorAll('script[type="application/ld+json"]')].map((node) =>
    JSON.parse(node.textContent ?? "{}"),
  );
}

/** Visible text only — JSON-LD `script` elements intentionally carry all three
 * locales (alternateName) and so must not count as a leak. */
function visibleText(container: HTMLElement) {
  const clone = container.cloneNode(true) as HTMLElement;
  for (const script of clone.querySelectorAll("script")) script.remove();
  return clone.textContent ?? "";
}

describe("/services/[category] detail page", () => {
  it("renders the reference catalog content for every category, in every locale", async () => {
    // Phase 2, item 3 — content parity at RENDER level, all 10 categories × 3
    // locales: the catalog record test (categories.test.ts) already pins the
    // data against the reference field by field; this proves the localized
    // values actually reach the HTML for every category, not just "gen".
    const OTHER_LOCALES = { fa: ["en", "ar"], en: ["fa", "ar"], ar: ["fa", "en"] } as const;
    for (const locale of LOCALES) {
      mockedLocale = locale;
      for (const id of SERVICE_CATEGORY_ORDER) {
        const { container, unmount } = await renderCategory(id);
        const category = getLocalizedCategory(id, locale);
        expect(category, `catalog missing ${id}`).not.toBeNull();
        expect(container.textContent).toContain(category!.name);
        expect(container.textContent).toContain(category!.description);
        for (const benefit of category!.benefits) {
          expect(container.textContent).toContain(benefit.title);
        }
        for (const item of category!.items) {
          expect(container.textContent).toContain(item.name);
          expect(container.textContent).toContain(item.description);
        }
        // Cross-locale isolation: the page must not leak another locale's
        // version of this category's name (catches a hardcoded fa string that
        // parity-by-accident would miss). The three scripts never collide;
        // measured over VISIBLE text — the JSON-LD `alternateName` carries
        // all three locales on purpose.
        for (const other of OTHER_LOCALES[locale]) {
          const foreign = getLocalizedCategory(id, other)!;
          expect(visibleText(container), `${id}: ${other} name leaked`).not.toContain(foreign.name);
        }
        unmount();
      }
    }
    mockedLocale = undefined;
  });

  it("shows a visible breadcrumb whose three entries match the BreadcrumbList JSON-LD", async () => {
    const { container } = await renderCategory("plastic");
    const crumbs = screen.getByRole("navigation", { name: "breadcrumb" });
    const visible = [...crumbs.querySelectorAll("a, b")].map((node) => node.textContent);
    expect(visible).toEqual([
      t("fa", "nav.home"),
      t("fa", "nav.services"),
      getLocalizedCategory("plastic", "fa")!.name,
    ]);

    const breadcrumb = jsonLdDocuments(container).find((doc) => doc["@type"] === "BreadcrumbList");
    expect(breadcrumb.itemListElement.map((item: { name: string }) => item.name)).toEqual(visible);
    expect(breadcrumb.itemListElement.map((item: { position: number }) => item.position)).toEqual([
      1, 2, 3,
    ]);
    expect(breadcrumb.itemListElement[2].item).toBe(
      `${siteConfig.url}/services/plastic`,
    );
  });

  it("emits a Service document for the page's own category and locale", async () => {
    mockedLocale = "en";
    const { container } = await renderCategory("gyn");
    const service = jsonLdDocuments(container).find((doc) => doc["@type"] === "Service");
    expect(service.name).toBe(getLocalizedCategory("gyn", "en")!.name);
    expect(service.inLanguage).toBe("en");
    expect(service.url).toBe(`${siteConfig.url}/services/gyn`);
    mockedLocale = undefined;
  });

  it("links only inside the implemented scope plus the contact affordance", async () => {
    const { container } = await renderCategory("uro");
    const hrefs = [...container.querySelectorAll("a[href]")].map((node) => node.getAttribute("href"));
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/services");
    for (const href of hrefs) {
      const inScope =
        href === "/" ||
        href === "/services" ||
        href?.startsWith("tel:") ||
        /^\/services\/(gen|gyn|uro|ortho|plastic|aes|eye|ent|endo|anes)$/.test(href ?? "");
      expect(inScope, `out-of-scope anchor on the detail page: ${href}`).toBe(true);
    }
  });

  it("carries the back-to-services link and no doctor/guide/loan/club content", async () => {
    const { container } = await renderCategory("eye");
    const html = container.innerHTML;
    expect(screen.getByText(t("fa", "sv.all"))).toBeInTheDocument();
    expect(html).not.toMatch(/پزشکان این بخش|تیم پزشکی|وام درمانی|باشگاه|کارت عضویت|عضویت/);
    expect(html).not.toMatch(/doctors\.html|guide\.html|loan\.html|club/);
  });

  it("throws Next's notFound for an unknown category id, never a broken page", async () => {
    // In the real router notFound() aborts into the 404 boundary; called
    // directly it raises Next's internal signal. Either way the guarantee is
    // that no markup is produced for an id the catalog does not hold.
    await expect(
      CategoryPage({ params: Promise.resolve({ category: "cardio" }) }),
    ).rejects.toThrow(/404/);
  });
});
