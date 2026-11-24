import { getLocale } from "@/core/i18n/getLocale";
import { StaticReferencePage } from "@/modules/publicSite/components/StaticReferencePage";
import { staticReferenceMetadata } from "@/modules/publicSite/lib/staticMetadata";

export const metadata = staticReferenceMetadata("internationalPatients", "/international-patients");

export default async function InternationalPatientsPage() {
  return <StaticReferencePage page="internationalPatients" locale={await getLocale()} />;
}
