import type { Locale } from "@/core/i18n/locales";
import staticPages from "../content/static-pages.json";

export type StaticReferencePageKey = keyof typeof staticPages;

/**
 * Renders the reference page's own main markup and icon sprite. The snapshots
 * are generated from the read-only source by scripts/import-public-reference.mjs;
 * no prose, images or layout structure are synthesized here.
 */
export function StaticReferencePage({
  page,
  locale,
}: {
  page: StaticReferencePageKey;
  locale: Locale;
}) {
  const source = staticPages[page];
  const localized = source.faOnly ? source.fa : source[locale];

  return (
    <div className={`reference-static-page ${source.bodyClassName}`}>
      <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: source.sprite }} />
      <div
        className={localized.className || undefined}
        lang={source.faOnly ? "fa" : localized.lang || undefined}
        dir={source.faOnly ? "rtl" : localized.dir || undefined}
        data-content-locale={source.faOnly ? "fa-only" : locale}
        dangerouslySetInnerHTML={{ __html: localized.html }}
      />
    </div>
  );
}
