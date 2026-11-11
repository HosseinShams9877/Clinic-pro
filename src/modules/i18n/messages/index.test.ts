import { describe, expect, it } from "vitest";

import type { Locale } from "@/core/i18n/locales";

import { ar, en, fa, getMessages, messages, t, type MessageKey } from "./index";

const LOCALE_CATALOGS: ReadonlyArray<[Locale, Record<string, string>]> = [
  ["fa", fa],
  ["en", en],
  ["ar", ar],
];

/**
 * The key-completeness gate (LOCALIZATION_AND_CALENDAR.md §2): every locale
 * must declare exactly the key set of the canonical fa catalog. The compile
 * time `satisfies Record<Locale, Messages>` guard fails the build first; this
 * test fails the test run if someone bypasses the compiler.
 */
describe("message catalog key completeness", () => {
  const faKeys = Object.keys(fa).sort();

  it("has a non-empty canonical fa catalog", () => {
    expect(faKeys.length).toBeGreaterThan(100);
    expect(faKeys.length).toBeLessThan(300);
  });

  it.each(LOCALE_CATALOGS)("locale %s declares exactly the fa key set", (locale, catalog) => {
    expect(Object.keys(catalog).sort()).toEqual(faKeys);
  });

  it("registers all three locales under the same shape", () => {
    expect(Object.keys(messages).sort()).toEqual(["ar", "en", "fa"]);
    for (const [, catalog] of LOCALE_CATALOGS) {
      expect(Object.keys(catalog).sort()).toEqual(faKeys);
    }
  });

  it("has no empty values in any locale", () => {
    for (const [, catalog] of LOCALE_CATALOGS) {
      for (const [key, value] of Object.entries(catalog)) {
        expect(value, `${key} is empty`).not.toBe("");
      }
    }
  });

  it("looks up a message in each locale and never returns the key", () => {
    const sample: MessageKey[] = ["nav.home", "h.svT", "sv2.call", "status.open", "ft.company"];
    for (const [locale, catalog] of LOCALE_CATALOGS) {
      for (const key of sample) {
        expect(t(locale, key)).toBe(catalog[key]);
      }
    }
  });

  it("getMessages returns the whole catalog per locale", () => {
    expect(getMessages("fa")).toBe(fa);
    expect(getMessages("en")).toBe(en);
    expect(getMessages("ar")).toBe(ar);
  });
});
