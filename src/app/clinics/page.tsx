import { getLocale } from "@/core/i18n/getLocale";
import { StaticReferencePage } from "@/modules/publicSite/components/StaticReferencePage";
import { staticReferenceMetadata } from "@/modules/publicSite/lib/staticMetadata";

export const metadata = staticReferenceMetadata("clinics", "/clinics");

export default async function ClinicsPage() {
  return <StaticReferencePage page="clinics" locale={await getLocale()} />;
}
