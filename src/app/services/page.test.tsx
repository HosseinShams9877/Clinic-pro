/**
 * page.test.tsx — the /services landing render gates (P1-10 / P1-11 / P1-12).
 *
 * Rendered as the router would (the async page awaited inside the client
 * provider tree, next/headers mocked). The assertions pin the landing's half
 * of the implementation boundary:
 *   - all ten catalog categories appear as cards linking to their own routes,
 *   - the two reference group sections (#surgical / #medical) carry them,
 *   - every anchor in the shipped HTML resolves inside the implemented scope
 *     or is a contact affordance (tel:) — nothing points at the parts of the
 *     reference that are out of scope (guides, doctors, loan, club).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import { makeQueryClient } from "@/core/query/client";
import { LOCALES } from "@/core/i18n/locales";
import { SERVICE_CATEGORY_ORDER } from "@/modules/services/constants";
import { getLocalizedCategories } from "@/modules/services/services";
import { t } from "@/modules/i18n/messages";

/** The locale the mocked next/headers will resolve. */
let mockedLocale: "fa" | "en" | "ar" | undefined;

vi.mock("next/headers", () => ({
  cookies: () => ({ get: () => undefined }),
  headers: () => ({ get: () => mockedLocale && `xx, ${mockedLocale};q=1` }),
}));

const { default: ServicesPage } = await import("./page");

/** Render the (async) page as the router would, inside the client provider tree. */
async function renderServices() {
  const page = (await (ServicesPage as () => Promise<ReactNode>)()) as ReactNode;
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

describe("/services landing page", () => {
  it("renders the hero with the localized heading and the breadcrumb back home", async () => {
    const { container } = await renderServices();
    const h1 = container.querySelector("h1");
    expect(h1).toHaveTextContent(t("fa", "sv2.t1"));
    const crumbs = screen.getByRole("navigation", { name: "breadcrumb" });
    expect(crumbs.innerHTML).toContain(t("fa", "nav.home"));
    expect(crumbs.innerHTML).toContain(t("fa", "nav.services"));
  });

  it("paints all ten categories as cards linking to their own routes, and nothing more", async () => {
    const { container } = await renderServices();
    const cardLinks = [...container.querySelectorAll("a[href^='/services/']")].map(
      (node) => node.getAttribute("href"),
    );
    expect(cardLinks).toHaveLength(10);
    for (const id of SERVICE_CATEGORY_ORDER) {
      expect(cardLinks).toContain(`/services/${id}`);
    }
    for (const category of getLocalizedCategories("fa")) {
      expect(container.textContent).toContain(category.name);
    }
  });

  it("labels the ten cards in every locale — full trilingual render parity (P2 item 3)", async () => {
    // The card test above checks fa names; this walks all three locales so the
    // landing cannot be complete in the data yet render one locale only.
    for (const locale of LOCALES) {
      mockedLocale = locale;
      const { container, unmount } = await renderServices();
      for (const category of getLocalizedCategories(locale)) {
        expect(container.textContent, `${locale}: ${category.id} name`).toContain(category.name);
      }
      // Card anchors wrap the localized name plus description: each card must
      // carry its locale's name (the name set never collides across locales).
      const names = getLocalizedCategories(locale).map((category) => category.name);
      const cards = [...container.querySelectorAll("a[href^='/services/']")];
      expect(cards).toHaveLength(10);
      for (const card of cards) {
        const label = card.textContent ?? "";
        expect(names.some((name) => label.includes(name)), `${locale}: exotic card label`).toBe(true);
      }
      unmount();
    }
    mockedLocale = undefined;
  });

  it("groups the cards under the reference's two section headings with their anchors", async () => {
    const { container } = await renderServices();
    const surgical = container.querySelector("#surgical");
    const medical = container.querySelector("#medical");
    expect(surgical).not.toBeNull();
    expect(medical).not.toBeNull();
    expect(surgical!.querySelector("h2")).toHaveTextContent(t("fa", "sg.surg"));
    expect(medical!.querySelector("h2")).toHaveTextContent(t("fa", "sg.med"));
    expect(surgical!.querySelectorAll("a[href^='/services/']")).toHaveLength(7);
    expect(medical!.querySelectorAll("a[href^='/services/']")).toHaveLength(3);
  });

  it("ships a tel: advisory CTA and every anchor is in-scope or a contact affordance", async () => {
    const { container } = await renderServices();
    const hrefs = [...container.querySelectorAll("a[href]")].map((node) => node.getAttribute("href"));
    expect(hrefs.some((href) => href?.startsWith("tel:"))).toBe(true);
    for (const href of hrefs) {
      const inScope =
        href === "/" ||
        href === "/services" ||
        /^\/services\/(gen|gyn|uro|ortho|plastic|aes|eye|ent|endo|anes)$/.test(href ?? "") ||
        href?.startsWith("tel:");
      expect(inScope, `out-of-scope anchor on the landing: ${href}`).toBe(true);
    }
  });

  it("carries no guide, doctors, loan, or loyalty-club content — the boundary holds", async () => {
    const { container } = await renderServices();
    const html = container.innerHTML;
    expect(html).not.toMatch(/پزشکان این بخش|تیم پزشکی|وام درمانی|باشگاه|کارت عضویت|عضویت/);
    expect(html).not.toMatch(/doctors\.html|guide\.html|loan\.html|club/);
    expect(html).not.toMatch(/\b(ln|cb|gd)\./);
  });

  it("renders in all three locales", async () => {
    for (const locale of LOCALES) {
      mockedLocale = locale;
      const { container, unmount } = await renderServices();
      const h1 = container.querySelector("h1");
      expect(h1).toHaveTextContent(t(locale, "sv2.t1"));
      expect(container.textContent).toContain(t(locale, "sg.surg"));
      unmount();
    }
    mockedLocale = undefined;
  });
});
