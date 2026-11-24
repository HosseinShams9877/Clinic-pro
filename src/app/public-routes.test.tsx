import type { ComponentType, ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let mockedLocale: "fa" | "en" | "ar" = "fa";

vi.mock("next/headers", () => ({
  cookies: () => ({ get: () => undefined }),
  headers: () => ({ get: () => `xx, ${mockedLocale};q=1` }),
}));

import AboutPage from "./about/page";
import AdmissionPage from "./admission/page";
import ClinicsPage from "./clinics/page";
import DoctorsPage from "./doctors/page";
import DoctorProfilePage, { generateStaticParams as doctorParams } from "./doctors/[id]/page";
import GuidePage from "./guide/page";
import GuideItemPage, { generateStaticParams as guideParams } from "./guide/[id]/page";
import InternationalPatientsPage from "./international-patients/page";
import PatientRightsPage from "./patient-rights/page";
import MedicalServicesPage from "./services/medical/page";
import SurgicalServicesPage from "./services/surgical/page";
import VisitingPage from "./visiting/page";
import guide from "@/modules/publicSite/content/guide.json";
import profiles from "@/modules/publicSite/content/doctor-profiles.json";

type AsyncPage = ComponentType<any> | ((props: any) => Promise<ReactNode>);

async function renderPage(Page: AsyncPage, props: Record<string, unknown> = {}) {
  const node = await (Page as (props: any) => ReactNode | Promise<ReactNode>)(props);
  return render(node);
}

afterEach(() => {
  cleanup();
  mockedLocale = "fa";
});

describe("remaining public route render gates", () => {
  it.each([
    ["surgical", SurgicalServicesPage, "خدمات جراحی"],
    ["medical", MedicalServicesPage, "خدمات پزشکی"],
  ])("renders the %s service-group landing from the reference", async (_name, Page, title) => {
    const { container } = await renderPage(Page);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(title);
    expect(container.querySelectorAll(".scat").length).toBeGreaterThan(0);
    expect(container.innerHTML).not.toMatch(/\.html|patient-panel|assistant/i);
  });

  it("renders all 66 doctors and all 12 guide topics", async () => {
    const doctors = await renderPage(DoctorsPage, { searchParams: Promise.resolve({}) });
    expect(doctors.container.querySelectorAll(".doc")).toHaveLength(66);
    cleanup();

    const guides = await renderPage(GuidePage, { searchParams: Promise.resolve({}) });
    expect(guides.container.querySelectorAll(".gsc")).toHaveLength(12);
  });

  it.each([
    ["about", AboutPage],
    ["clinics", ClinicsPage],
    ["visiting", VisitingPage],
    ["patient rights", PatientRightsPage],
    ["admission", AdmissionPage],
    ["international patients", InternationalPatientsPage],
  ])("renders the complete %s reference main without forbidden destinations", async (_name, Page) => {
    const { container } = await renderPage(Page);
    expect(container.querySelector("h1")).not.toBeNull();
    const hrefs = [...container.querySelectorAll("a[href]")].map((link) => link.getAttribute("href") ?? "");
    expect(hrefs.join("\n")).not.toMatch(/\.html|panel|admin|account/i);
  });

  it("renders every publishable and home-linked doctor profile with the demo reviews section", async () => {
    const ids = [...new Set([...Object.keys(profiles), "kheirkhah", "aghadoust", "mohammad-eidi", "abolhassani"])];
    expect(doctorParams()).toEqual(ids.map((id) => ({ id })));
    for (const id of ids) {
      const { container } = await renderPage(DoctorProfilePage, { params: Promise.resolve({ id }) });
      expect(container.querySelector("h1")).not.toBeNull();
      expect(container.querySelector("#creds")).toBeNull();
      expect(container.querySelector("#reviews .prev-form")).not.toBeNull();
      expect(container.querySelector(".ps-video")).toBeNull();
      expect(container.querySelectorAll("#faq details")).toHaveLength(3);
      const serviceCount = id === "farajipour" ? 3 : 0;
      expect(container.querySelectorAll("#services .psv")).toHaveLength(serviceCount);
      cleanup();
    }
  });

  it("renders every guide item while omitting placeholder video/audio blocks", async () => {
    expect(guideParams()).toEqual(guide.surgeries.map((item) => ({ id: item.id })));
    for (const item of guide.surgeries) {
      const { container } = await renderPage(GuideItemPage, { params: Promise.resolve({ id: item.id }) });
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(item.n.fa);
      expect(container.querySelector(".gvideos")).toBeNull();
      expect(container.querySelector(".gaudio")).toBeNull();
      expect(container.textContent).not.toContain("به‌زودی");
      cleanup();
    }
  });

  it.each(["fa", "en", "ar"] as const)("keeps the directory routes renderable in %s", async (locale) => {
    mockedLocale = locale;
    const doctors = await renderPage(DoctorsPage, { searchParams: Promise.resolve({ q: "" }) });
    expect(doctors.container.querySelectorAll(".doc")).toHaveLength(66);
    cleanup();
    const guides = await renderPage(GuidePage, { searchParams: Promise.resolve({ q: "" }) });
    expect(guides.container.querySelectorAll(".gsc")).toHaveLength(12);
  });
});
