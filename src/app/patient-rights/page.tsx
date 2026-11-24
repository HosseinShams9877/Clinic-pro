import { getLocale } from "@/core/i18n/getLocale";
import { StaticReferencePage } from "@/modules/publicSite/components/StaticReferencePage";
import { staticReferenceMetadata } from "@/modules/publicSite/lib/staticMetadata";

export const metadata = staticReferenceMetadata("patientRights", "/patient-rights");

export default async function PatientRightsPage() {
  return <StaticReferencePage page="patientRights" locale={await getLocale()} />;
}
