/**
 * categories.test.ts — the content-parity gate (P1-07 check, P1-15 gate).
 *
 * The catalog in src is a *copy* of the reference's services-data.js, and this
 * test is what keeps it a copy: it executes the reference file itself (an
 * IIFE that sets window.SERVICE_CATS — read-only, never written) and compares
 * every category, in every locale, field by field. If either side drifts, the
 * parity claim of docs/knowledge/CONTENT_INVENTORY.md §7 fails loudly.
 *
 * The only sanctioned deviations are the documented ones:
 *   - img paths rebased "assets/img/..." → "/img/..." (A2 asset migration);
 *   - the reference `doc` field (doctors.html anchors) is not carried over;
 *   - field aliases normalized (n → name, d → description, t → title).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { LOCALES } from "@/core/i18n/locales";
import { getServiceCategories } from "@/modules/services/services";
import { SERVICE_CATEGORY_ORDER } from "@/modules/services/constants";

/** The reference catalog, executed in this jsdom window exactly as a browser would. */
function loadReference(): Array<{
  id: string;
  group: string;
  img: string;
  icon: string;
  floor: number;
  name: Record<string, string>;
  desc: Record<string, string>;
  benefits: Array<{ i: string; t: Record<string, string> }>;
  items: Array<{ icon?: string; img?: string; n: Record<string, string>; d: Record<string, string> }>;
}> {
  const source = readFileSync(
    join(process.cwd(), "پلتفرم", "assets", "js", "services-data.js"),
    "utf8",
  );
  // The file is a self-contained IIFE that assigns window.SERVICE_CATS.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-eval
  (0, eval)(source);
  return (window as unknown as { SERVICE_CATS: unknown }).SERVICE_CATS as never;
}

const REFERENCE = loadReference();

/** The reference's "assets/..." prefix becomes the app's public root. */
function rebased(referencePath: string): string {
  return referencePath.replace(/^assets\//, "/");
}

describe("catalog parity with پلتفرم/assets/js/services-data.js", () => {
  it("carries all ten reference categories, in the reference's client-requested order", () => {
    const catalog = getServiceCategories();
    expect(catalog.map((category) => category.id)).toEqual(
      REFERENCE.map((category) => category.id),
    );
    expect(SERVICE_CATEGORY_ORDER).toEqual(REFERENCE.map((category) => category.id));
    expect(catalog).toHaveLength(10);
  });

  it("keeps each category's group and floor exactly as the reference assigns them", () => {
    const byId = new Map(getServiceCategories().map((category) => [category.id, category]));
    for (const reference of REFERENCE) {
      const category = byId.get(reference.id);
      expect(category?.group, reference.id).toBe(reference.group);
      expect(category?.floor, reference.id).toBe(reference.floor);
    }
  });

  it("matches every category name and description in all three locales", () => {
    const byId = new Map(getServiceCategories().map((category) => [category.id, category]));
    for (const reference of REFERENCE) {
      const category = byId.get(reference.id);
      for (const locale of LOCALES) {
        expect(category?.name[locale], `${reference.id}.name.${locale}`).toBe(reference.name[locale]);
        expect(category?.description[locale], `${reference.id}.desc.${locale}`).toBe(
          reference.desc[locale],
        );
      }
    }
  });

  it("matches every benefit (icon + title) and every item (name + description), trilingual", () => {
    const byId = new Map(getServiceCategories().map((category) => [category.id, category]));
    for (const reference of REFERENCE) {
      const category = byId.get(reference.id);
      expect(category?.benefits.map((b) => b.icon), `${reference.id}.benefit icons`).toEqual(
        reference.benefits.map((b) => b.i),
      );
      expect(
        category?.items.map((i) => i.name.fa),
        `${reference.id}.item names`,
      ).toEqual(reference.items.map((i) => i.n.fa));
      for (const locale of LOCALES) {
        expect(
          category?.benefits.map((b) => b.title[locale]),
          `${reference.id}.benefits.${locale}`,
        ).toEqual(reference.benefits.map((b) => b.t[locale]));
        expect(
          category?.items.map((i) => `${i.name[locale]} · ${i.description[locale]}`),
          `${reference.id}.items.${locale}`,
        ).toEqual(reference.items.map((i) => `${i.n[locale]} · ${i.d[locale]}`));
      }
    }
  });

  it("rebased image paths keep the reference's own assets (no invented imagery)", () => {
    const byId = new Map(getServiceCategories().map((category) => [category.id, category]));
    for (const reference of REFERENCE) {
      const category = byId.get(reference.id);
      expect(category?.image, `${reference.id}.image`).toBe(rebased(reference.img));
      expect(category?.icon, `${reference.id}.icon`).toBe(reference.icon);
      expect(
        category?.items.map((i) => i.image ?? null),
        `${reference.id}.item images`,
      ).toEqual(reference.items.map((i) => (i.img ? rebased(i.img) : i.icon ? null : null)));
    }
  });

  it("carries no doctor link — the reference `doc` field is deliberately dropped", () => {
    for (const category of getServiceCategories()) {
      expect(category).not.toHaveProperty("doc");
    }
  });
});
