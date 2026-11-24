import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render } from "@testing-library/react";

import { ROUTES, siteConfig } from "@/config/site.config";
import { LOCALES, type Locale } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { servicesPageCopy } from "@/modules/services/content/pages";

let mockedLocale: Locale = "fa";

vi.mock("next/headers", () => ({
  cookies: () => ({ get: () => undefined }),
  headers: () => ({ get: () => `xx, ${mockedLocale};q=1` }),
}));

const { default: ServicesPage } = await import("./page");

async function renderServices() {
  return render((await (ServicesPage as () => Promise<ReactNode>)()) as ReactNode);
}

afterEach(() => {
  mockedLocale = "fa";
});

describe("/services reference gateway", () => {
  it("renders the exact two-path reference structure", async () => {
    const { container } = await renderServices();
    const copy = servicesPageCopy.fa.gateway;

    expect(container.querySelector(".services-gateway-page.patient-pages")).not.toBeNull();
    expect(container.querySelector("h1")).toHaveTextContent(copy.title);
    expect(container.querySelector(".pp-intro p")).toHaveTextContent(copy.lead);

    const paths = [...container.querySelectorAll<HTMLAnchorElement>(".pp-path")];
    expect(paths).toHaveLength(2);
    expect(paths.map((link) => link.getAttribute("href"))).toEqual([
      ROUTES.servicesSurgical,
      ROUTES.servicesMedical,
    ]);
    expect(paths[0]).toHaveTextContent(copy.surgical.title);
    expect(paths[0]).toHaveTextContent(copy.surgical.description);
    expect(paths[1]).toHaveTextContent(copy.medical.title);
    expect(paths[1]).toHaveTextContent(copy.medical.description);
  });

  it("uses the reference images and accessible localized alternatives", async () => {
    const { container } = await renderServices();
    const images = [...container.querySelectorAll<HTMLImageElement>(".pp-path img")];
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("alt", servicesPageCopy.fa.gateway.surgical.imageAlt);
    expect(images[1]).toHaveAttribute("alt", servicesPageCopy.fa.gateway.medical.imageAlt);
    expect(decodeURIComponent(images[0]!.getAttribute("src") ?? "")).toContain("/img/services/or.jpg");
    expect(decodeURIComponent(images[1]!.getAttribute("src") ?? "")).toContain("/img/guide/v-doctor.jpg");
  });

  it("localizes every visible gateway field in Persian, English, and Arabic", async () => {
    for (const locale of LOCALES) {
      mockedLocale = locale;
      const { container, unmount } = await renderServices();
      const copy = servicesPageCopy[locale].gateway;
      expect(container).toHaveTextContent(t(locale, "nav.home"));
      expect(container).toHaveTextContent(copy.pageTitle);
      expect(container).toHaveTextContent(copy.title);
      expect(container).toHaveTextContent(copy.surgical.action);
      expect(container).toHaveTextContent(copy.medical.action);
      expect(container).toHaveTextContent(copy.helpTitle);
      expect(container).toHaveTextContent(copy.callAction);
      expect(container.querySelector(".services-gateway-page")).toHaveAttribute(
        "data-content-locale",
        locale,
      );
      unmount();
    }
  });

  it("does not collapse the gateway back into the obsolete ten-category catalog", async () => {
    const { container } = await renderServices();
    expect(container.querySelector(".shero")).toBeNull();
    expect(container.querySelector(".scats-wrap")).toBeNull();
    expect(container.querySelector('a[href^="/services/"]:not([href="/services/surgical"]):not([href="/services/medical"])')).toBeNull();
  });

  it("keeps every gateway destination real and in scope", async () => {
    const { container } = await renderServices();
    const hrefs = [...container.querySelectorAll<HTMLAnchorElement>("a[href]")].map(
      (link) => link.getAttribute("href"),
    );
    expect(hrefs).toContain(ROUTES.home);
    expect(hrefs).toContain(ROUTES.servicesSurgical);
    expect(hrefs).toContain(ROUTES.servicesMedical);
    expect(hrefs).toContain(`tel:${siteConfig.phone}`);
    for (const href of hrefs) {
      expect([
        ROUTES.home,
        ROUTES.servicesSurgical,
        ROUTES.servicesMedical,
        `tel:${siteConfig.phone}`,
      ]).toContain(href);
    }
  });
});
