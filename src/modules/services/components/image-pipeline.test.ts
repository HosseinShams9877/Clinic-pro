/**
 * image-pipeline.test.ts — the image-pipeline gate (P2 item 8, 2026-11-10).
 *
 * Phase 1 shipped raw <img> tags pointing at /img/*: the bytes were served
 * verbatim (a 332 KB hero JPEG), no responsive srcset, and the browser had
 * no width/height to reserve. Phase 2 routes every image through next/image:
 * the optimizer negotiates AVIF/WebP (formats declared in next.config.ts)
 * and each usage fills a box whose aspect the markup reserves, so decoded
 * AVIF cannot shift layout. These guards pin that at the source level —
 * a regression to a raw <img> or a sizes-less <Image> fails here.
 *
 * Live evidence collected on the production build (fa/RTL, CDP):
 *   or-hero AVIF w=640: 21 KB vs the 332 KB source JPEG (94% smaller),
 *   `Vary: Accept` on the optimized response,
 *   every shipped img box identical to the raw-<img> baseline (0 mismatches
 *   across /, /services, /services/gen × 393px/1280px),
 *   LCP element = the hero picture on all three routes.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (file: string) =>
  readFileSync(join(process.cwd(), "src", file), "utf8");

const SITES = [
  "app/page.tsx",
  "app/services/page.tsx",
  "modules/services/components/ServiceCategoryCard.tsx",
  "modules/services/components/SubServiceGrid.tsx",
  "modules/services/components/ServiceDetailPanel.tsx",
] as const;

describe("no raw <img> element ships", () => {
  it("uses next/image in every image site", () => {
    for (const file of SITES) {
      const src = read(file);
      expect(src, `${file} must import next/image`).toMatch(/from\s+"next\/image"/);
      expect(src, `${file} must not ship a raw <img element`).not.toMatch(/<img\s[^>]*src\s*=/);
    }
  });

  it("gives every <Image> a sizes hint (a srcset without sizes is a bug)", () => {
    for (const file of SITES) {
      const src = read(file);
      const images = src.match(/<Image[\s\S]*?\/>/g) ?? [];
      expect(images.length, `${file} should contain <Image> usages`).toBeGreaterThan(0);
      for (const usage of images) {
        expect(usage, "an <Image> is missing its sizes prop").toMatch(/\bsizes="[^"]+"/);
      }
    }
  });
});

describe("every image fills a box the markup reserved", () => {
  it("reserves the hero aspect on the wrapper, not the picture", () => {
    const home = read("app/page.tsx");
    expect(home).toMatch(/aspect-\[4\/3\][^>]*>/);
    expect(home).toMatch(/<Image[\s\S]*?src="\/img\/or-hero\.jpg"/);
  });

  it("keeps the care-banner figure tall without the old <img> min-height", () => {
    const home = read("app/page.tsx");
    expect(home).toMatch(/relative order-1 min-h-64/);
    expect(home).not.toMatch(/<img[^>]*min-h-64/);
  });

  it("reserves the services hero, card, grid and detail boxes", () => {
    expect(read("app/services/page.tsx")).toMatch(/aspect-\[4\/3\][^>]*>/);
    expect(read("modules/services/components/ServiceCategoryCard.tsx")).toMatch(
      /relative aspect-\[16\/10\]/,
    );
    expect(read("modules/services/components/SubServiceGrid.tsx")).toMatch(
      /relative aspect-\[16\/9\]/,
    );
    expect(read("modules/services/components/ServiceDetailPanel.tsx")).toMatch(
      /relative aspect-\[4\/3\]/,
    );
  });
});

describe("the LCP images are preloaded, the rest are not", () => {
  it("marks both hero pictures priority (they are the measured LCP element)", () => {
    const home = read("app/page.tsx");
    const services = read("app/services/page.tsx");
    expect(home).toMatch(/<Image[\s\S]*?src="\/img\/or-hero\.jpg"[\s\S]*?priority/);
    expect(services).toMatch(/<Image[\s\S]*?src="\/img\/guide\/v-or\.jpg"[\s\S]*?priority/);
  });

  it("does not priority-flag the below-fold pictures", () => {
    const home = read("app/page.tsx");
    // Split on <Image so each usage is its own chunk (a greedy span from an
    // earlier hero <Image> would carry its priority into the match).
    const corridor = home
      .split(/(?=<Image\b)/)
      .find((chunk) => chunk.includes('src="/img/corridor-wide.jpg"'));
    expect(corridor, "the corridor-wide <Image> should exist").toBeTruthy();
    expect(corridor).not.toMatch(/priority/);
  });
});
