import type { Metadata } from "next";

import { getLocale } from "@/core/i18n/getLocale";
import { ServiceGroupLanding } from "@/modules/services/components/ServiceGroupLanding";
import { routeMetadata } from "@/modules/seo/lib/metadata";

export const metadata: Metadata = routeMetadata({
  title: "خدمات جراحی",
  description: "معرفی ۶۶ پزشک متخصص و فوق تخصص مرکز جراحی دکتر خیرخواه کاشان در رشته‌های زنان و نازایی، چشم، گوش و حلق و بینی، جراحی عمومی، ارولوژی، قلب و بیهوشی.",
  path: "/services/surgical",
});

export default async function SurgicalServicesPage() {
  return <ServiceGroupLanding group="surg" locale={await getLocale()} />;
}
