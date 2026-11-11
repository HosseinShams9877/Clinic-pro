/**
 * index.ts — the message catalog registry (LOCALIZATION_AND_CALENDAR.md §2).
 *
 * fa is canonical (`typeof fa` is THE contract). The `satisfies` check below
 * is the compile-time key-completeness gate: if en.ts or ar.ts is missing a
 * key that fa.ts declares, or declares a key fa.ts does not, `tsc --noEmit`
 * and `next build` both fail. There is no partial catalog anywhere.
 */

import type { Locale } from "@/core/i18n/locales";

import { ar } from "./ar";
import { en } from "./en";
import { fa } from "./fa";

// Re-exported so tests and tooling can compare the three catalogs directly.
export { ar, en, fa };

/** The canonical message shape, derived from the Persian catalog. */
export type Messages = typeof fa;

/** Every message key the app may ask for. */
export type MessageKey = keyof Messages;

export const messages = { fa, en, ar } satisfies Record<Locale, Messages>;

/**
 * Look up a single message in a locale, falling back to fa (the canonical
 * source) and then to the key itself. The fallback exists for safety in
 * server-rendered paths only — the key-completeness gate above means a
 * complete catalog never actually hits it, and tests assert that.
 */
export function t(locale: Locale, key: MessageKey): string {
  const table = messages[locale] as Partial<Messages>;
  const value = table[key];
  if (typeof value === "string") return value;
  const fallback = messages.fa[key];
  if (typeof fallback === "string") return fallback;
  return String(key);
}

/** The whole catalog for one locale (used to seed client-side parsing). */
export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
