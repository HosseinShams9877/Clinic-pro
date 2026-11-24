import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render } from "@testing-library/react";

import { ROUTES, siteConfig } from "@/config/site.config";
import { LOCALES, type Locale } from "@/core/i18n/locales";
import { internationalPatientsCopy } from "@/modules/publicSite/content/internationalPatients";

let mockedLocale: Locale = "fa";

vi.mock("next/headers", () => ({
  cookies: () => ({ get: () => undefined }),
  headers: () => ({ get: () => `xx, ${mockedLocale};q=1` }),
}));

const { default: InternationalPatientsPage } = await import("./page");

async function renderPage() {
  return render((await (InternationalPatientsPage as () => Promise<ReactNode>)()) as ReactNode);
}

afterEach(() => {
  mockedLocale = "fa";
});

describe("/international-patients", () => {
  it("renders the complete reference journey and destinations", async () => {
    const { container } = await renderPage();
    const copy = internationalPatientsCopy.fa;

    expect(container.querySelector(".international-patients-page.patient-pages")).not.toBeNull();
    expect(container.querySelector("h1")).toHaveTextContent(copy.hero.title.join(""));
    expect(container.querySelectorAll(".pp-journey li")).toHaveLength(5);
    expect(container.querySelectorAll(".pp-faq details")).toHaveLength(4);
    expect(container.querySelector(".pp-intl-hero img")).toHaveAttribute("alt", copy.hero.imageAlt);

    const hrefs = [...container.querySelectorAll<HTMLAnchorElement>("a[href]")].map(
      (link) => link.getAttribute("href"),
    );
    expect(hrefs).toContain(ROUTES.servicesSurgical);
    expect(hrefs).toContain(ROUTES.servicesMedical);
    expect(hrefs).toContain(ROUTES.doctors);
    expect(hrefs).toContain(ROUTES.admission);
    expect(hrefs).toContain(ROUTES.guide);
    expect(hrefs).toContain(`tel:${siteConfig.phone}`);
    expect(hrefs.join("\n")).not.toMatch(/\.html|panel|account/i);
  });

  it("renders real translated content in every supported locale", async () => {
    for (const locale of LOCALES) {
      mockedLocale = locale;
      const { container, unmount } = await renderPage();
      const copy = internationalPatientsCopy[locale];

      expect(container.querySelector(".international-patients-page")).toHaveAttribute(
        "data-content-locale",
        locale,
      );
      expect(container).toHaveTextContent(copy.pageTitle);
      expect(container).toHaveTextContent(copy.hero.lead);
      expect(container).toHaveTextContent(copy.services.title);
      expect(container).toHaveTextContent(copy.journey.title);
      expect(container).toHaveTextContent(copy.checklist.title);
      expect(container).toHaveTextContent(copy.faq.title);
      expect(container).toHaveTextContent(copy.contact.title);
      expect(container.querySelector("[lang='fa'][dir='rtl']")).toBeNull();
      unmount();
    }
  });
});
