import { getLocale } from "@/core/i18n/getLocale";
import { InternationalPatientsContent } from "@/modules/publicSite/components/InternationalPatientsContent";
import { internationalPatientsCopy } from "@/modules/publicSite/content/internationalPatients";
import { routeMetadata } from "@/modules/seo/lib/metadata";

export const metadata = routeMetadata({
  title: internationalPatientsCopy.fa.pageTitle,
  description: internationalPatientsCopy.fa.hero.lead,
  path: "/international-patients",
});

export default async function InternationalPatientsPage() {
  return <InternationalPatientsContent locale={await getLocale()} />;
}
