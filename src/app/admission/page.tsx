import { getLocale } from "@/core/i18n/getLocale";
import { StaticReferencePage } from "@/modules/publicSite/components/StaticReferencePage";
import { staticReferenceMetadata } from "@/modules/publicSite/lib/staticMetadata";

export const metadata = staticReferenceMetadata("admission", "/admission");

export default async function AdmissionPage() {
  return <StaticReferencePage page="admission" locale={await getLocale()} />;
}
