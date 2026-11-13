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
  "modules/services/components/ServiceVideoButton.tsx",
  "modules/services/components/SubServiceGrid.tsx",
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
    // The B-2 fidelity port: the hero box is the reference's `.h-media` >
    // `.h-img` chain — the picture is `fill` (absolute inset 0), so the
    // wrapper owns every pixel of geometry and decoded AVIF cannot shift it.
    expect(home).toMatch(/<div className="h-media">[\s\S]*?<div className="h-img">/);
    expect(home).toMatch(/<Image[\s\S]*?src="\/img\/or-hero\.jpg"[\s\S]*?\bfill\b/);
    // And the box the fill mode targets is reserved in the ported reference
    // CSS (min-height on .h-media, absolute inset on .h-img) — never on the
    // <Image> itself, which carries no width/height of its own.
    const refCss = readFileSync(
      join(process.cwd(), "src", "styles", "globalCss", "reference.css"),
      "utf8",
    );
    expect(refCss).toMatch(/\.h-media\{[^}]*min-height:440px/);
    expect(refCss).toMatch(/\.h-img\{[^}]*position:absolute/);
  });

  it("keeps the care-banner figure tall without the old <img> min-height", () => {
    const home = read("app/page.tsx");
    // The care corridor keeps its tall figure via the reference's own
    // wrapper (`.hc-img`, min-height in reference.css), not via a Tailwind
    // utility on the picture.
    expect(home).toMatch(/<div className="hc-img">[\s\S]*?<Image[\s\S]*?corridor-wide\.jpg"[\s\S]*?\bfill\b/);
    expect(home).not.toMatch(/<img[^>]*min-h-64/);
    expect(home).not.toMatch(/<Image[^>]*min-h-64/);
  });

  it("reserves the services hero, advisory and card boxes in the ported geometry", () => {
    const services = read("app/services/page.tsx");
    // The B-3 fidelity port: the hero box is the reference's own `.sh-photo`
    // (position:relative + aspect-ratio:4/3 in reference.css) with a `fill`
    // <Image> inside, so the picture owns no geometry of its own and decoded
    // AVIF cannot shift it.
    expect(services).toMatch(/<div className="sh-photo">[\s\S]*?<Image[\s\S]*?src="\/img\/guide\/v-or\.jpg"[\s\S]*?\bfill\b/);
    // The advisory photo lives in the reference's `.sask-img`, which is NOT
    // positioned — a `fill` picture (absolute, inset 0) would collapse against
    // the initial containing box. It ships non-fill with the source's true
    // intrinsic 1200×422 as attributes, which the ported `.sask-img img`
    // (width/height 100%) overrides — the reference's own static-<img> geometry.
    expect(services).toMatch(
      /<div className="sask-img">[\s\S]*?<Image[\s\S]*?src="\/img\/services\/or\.jpg"[\s\S]*?width=\{1200\}[\s\S]*?height=\{422\}/,
    );
    // The category tile keeps the reference's `.scat img` geometry
    // (absolute, bottom half, masked) — a `fill` picture would override it
    // from its inline style, so the card picture must be non-fill with
    // width/height attributes.
    const card = read("modules/services/components/ServiceCategoryCard.tsx");
    expect(card).toMatch(/className="scat"/);
    expect(card).toMatch(/<Image[\s\S]*?width=\{[\s\S]*?height=\{/);
    expect(card).not.toMatch(/<Image[^>]*\bfill\b/);
    // And the two boxes the fill/non-fill choice keys on are reserved in the
    // ported reference CSS, never on the picture.
    const refCss = readFileSync(
      join(process.cwd(), "src", "styles", "globalCss", "reference.css"),
      "utf8",
    );
    expect(refCss).toMatch(/\.sh-photo\{[^}]*position:relative[^}]*aspect-ratio:4\/3/);
    expect(refCss).toMatch(/\.sask-img img\{[^}]*width:100%;height:100%/);
    expect(refCss).toMatch(/\.scat img[^{]*\{[^}]*position:absolute;inset:auto 0 0;height:52%/);
  });

  it("reserves the detail-video and item boxes in the ported geometry", () => {
    // The B-4 fidelity port: the trigger is the reference's own `button.sd-video`
    // — position:relative + aspect-ratio:16/10 in reference.css — so the picture
    // is `fill` (absolute inset 0), exactly the geometry of the reference's own
    // static <img> inside the button. The picture lives in the client island
    // that also owns the reference's ptoast behaviour.
    const video = read("modules/services/components/ServiceVideoButton.tsx");
    expect(video).toMatch(/className="sd-video"/);
    expect(video).toMatch(/<Image[\s\S]*?\bfill\b/);
    // The item cell keeps the reference's `.si-m` geometry — a fixed-height,
    // unpositioned box whose `.si-m img` sets width/height 100% — so the item
    // picture is non-fill with the source's true intrinsic width/height as
    // attributes (a fill picture's inline absolute/inset geometry would
    // collapse the cell). Items without a photo keep the `.si-mono` tile.
    const items = read("modules/services/components/SubServiceGrid.tsx");
    expect(items).toMatch(/className="si-m"/);
    expect(items).toMatch(/<Image[\s\S]*?width=\{[\s\S]*?height=\{/);
    expect(items).not.toMatch(/<Image[^>]*\bfill\b/);
    // And the two boxes the fill/non-fill choice keys on are reserved in the
    // ported reference CSS, never on the picture.
    const refCss = readFileSync(
      join(process.cwd(), "src", "styles", "globalCss", "reference.css"),
      "utf8",
    );
    expect(refCss).toMatch(/\.sd-video\{[^}]*position:relative[^}]*aspect-ratio:16\/10/);
    expect(refCss).toMatch(/\.si-m img\{[^}]*width:100%;height:100%/);
    expect(refCss).toMatch(/\.si-mono\{[^}]*display:grid/);
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
