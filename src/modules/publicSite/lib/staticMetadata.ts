import type { Metadata } from "next";

import { routeMetadata } from "@/modules/seo/lib/metadata";
import staticPages from "../content/static-pages.json";
import type { StaticReferencePageKey } from "../components/StaticReferencePage";

export function staticReferenceMetadata(page: StaticReferencePageKey, path: string): Metadata {
  const source = staticPages[page];
  const shortTitle = source.title.split("|")[0]?.trim() || source.title;
  const metadata = routeMetadata({ title: shortTitle, description: source.description, path });
  if (source.faOnly) {
    metadata.alternates = { canonical: path, languages: { fa: path } };
  }
  return metadata;
}
