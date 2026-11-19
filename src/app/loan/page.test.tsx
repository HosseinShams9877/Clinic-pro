/**
 * page.test.tsx — the /loan route's server-render gate.
 *
 * Rendered as a server component (the function is awaited, exactly as
 * the App Router would), with next/headers mocked so the locale is
 * deterministic. Pinned: the page is complete HTML without any client
 * script — the reference's explainer content renders server-side, the
 * no-JS notice is in the markup, and the wizard island is present as
 * its lazy boundary (never part of the initial bundle).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { t } from "@/modules/i18n/messages";

/** The locale the mocked next/headers will resolve (mirror of page.test.tsx). */
let mockedLocale: "fa" | "en" | "ar" | undefined;

vi.mock("next/headers", () => ({
  cookies: () => ({ get: () => undefined }),
  headers: () => ({ get: () => mockedLocale && `xx, ${mockedLocale};q=1` }),
}));

const { default: LoanPage } = await import("./page");

async function renderLoan() {
  const page = (await (LoanPage as (props: {
    searchParams: Promise<Record<string, string>>;
  }) => Promise<ReactNode>)({ searchParams: Promise.resolve({}) })) as ReactNode;
  return render(page);
}

describe("loan page (fa)", () => {
  beforeEach(() => {
    mockedLocale = "fa";
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));
  });

  it("renders the hero, the explainer sections and the FAQ as plain server HTML", async () => {
    await renderLoan();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(t("fa", "lp.t"));
    // The four "how it works" steps and the document chips.
    expect(screen.getByText(t("fa", "lp.h1"))).toBeInTheDocument();
    expect(screen.getByText(t("fa", "lp.d1"))).toBeInTheDocument();
    // The FAQ (reference: first entry open).
    expect(screen.getByText(t("fa", "lp.q1"))).toBeInTheDocument();
    expect(screen.getByText(t("fa", "lp.a1"))).toBeInTheDocument();
    // The bank-terms note.
    expect(screen.getByText(t("fa", "lp.note"))).toBeInTheDocument();
  });

  it("renders the no-JS notice in the HTML (progressive enhancement)", async () => {
    // React's client renderer drops <noscript> children, so this must be
    // asserted on the static markup — the bytes the browser actually
    // receives before any script runs.
    const page = (await (LoanPage as (props: {
      searchParams: Promise<Record<string, string>>;
    }) => Promise<ReactNode>)({ searchParams: Promise.resolve({}) })) as ReactNode;
    const html = renderToStaticMarkup(page);
    expect(html).toContain("<noscript");
    expect(html).toContain(t("fa", "lw.js"));
  });

  it("ships the wizard's lazy boundary, not an interactive form, in the initial HTML", async () => {
    const { container } = await renderLoan();
    // The lazy island mounts as its loading placeholder server-side; the
    // interactive credit-step markup is nowhere in the SSR output.
    expect(container.querySelector(".ln-wizard")).toBeInTheDocument();
    expect(container.querySelectorAll("input[name=otp]")).toHaveLength(0);
  });

  it("links into the built site only — home crumb live, guide crumb plain text", async () => {
    const { container } = await renderLoan();
    const crumbs = container.querySelector(".crumbs") as HTMLElement;
    expect(crumbs.querySelector("a")?.getAttribute("href")).toBe("/");
    // The guide crumb must not link out of scope (Q4 — no dead links).
    expect(crumbs.querySelectorAll("a")).toHaveLength(1);
  });

  it("renders the home loan section's entry point image from the copied reference asset", async () => {
    const { container } = await renderLoan();
    const hero = container.querySelector(".phx-v img") as HTMLImageElement | null;
    expect(hero?.getAttribute("src")).toContain("p-form.jpg");
  });
});

describe("loan page (en)", () => {
  beforeEach(() => {
    mockedLocale = "en";
  });

  it("renders fully localized under ?lang=en", async () => {
    await renderLoan();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(t("en", "lp.t"));
    expect(screen.getByText(t("en", "lp.h1"))).toBeInTheDocument();
    expect(screen.getByText(t("en", "lp.note"))).toBeInTheDocument();
  });
});
