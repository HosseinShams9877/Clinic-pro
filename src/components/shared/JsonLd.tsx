/**
 * JsonLd.tsx — renders one JSON-LD document (server component, P1-14).
 *
 * Structured data is serialized verbatim from the Zod-validated builders in
 * modules/seo/lib/structuredData; this component only injects the resulting
 * JSON into the document.
 */

interface JsonLdProps {
  /** A validated JSON-LD document (see modules/seo/schemas/structuredData). */
  document: object;
}

export function JsonLd({ document }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(document) }}
    />
  );
}
