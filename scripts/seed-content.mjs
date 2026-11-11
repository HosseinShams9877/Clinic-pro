/**
 * seed-content.mjs — the single data-entry path for the service catalog
 * (Phase 2, item 2).
 *
 * The catalog is NOT in a database. Its source of truth is the reference project
 * (پلتفرم/assets/js/services-data.js, read-only), and this script is the
 * mechanical step between that source and the app's typed content file
 * (src/modules/services/content/categories.ts): it executes the reference file
 * in a VM (never writing to it), applies the documented transcription, and
 * either CHECKS the live file against the reference-derived catalog (default)
 * or REWRITES it (--write).
 *
 * The transcription (identical to the one provenance-noted in the generated
 * file header, and to what categories.test.ts asserts field by field):
 *   - ORDER/group baking: the reference assigns group + display order at runtime
 *     via ORDER = { surg: [...7 ids], med: [...3 ids] }; here they are baked
 *     into each record and the array is emitted in that final order.
 *   - `doc` is dropped (pointed at out-of-scope doctor pages — REC-3).
 *   - `img` is rebased "assets/img/..." → "/img/..." (public root).
 *   - Field aliases: n → name, d → description, t (benefit) → title,
 *     i → icon. Values are never touched.
 *   - Items carry `image` XOR `icon` exactly as the reference carries
 *     `img` XOR `icon`; the Zod schema (SubServiceSchema) enforces the same XOR.
 *
 * Default mode (check) exits nonzero on any drift — usable as a parity gate.
 *
 * Usage:
 *   node scripts/seed-content.mjs           # check live file vs reference
 *   node scripts/seed-content.mjs --write   # regenerate the file
 *
 * No dependencies: node:fs, node:vm, node:path only.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REFERENCE = resolve(ROOT, "پلتفرم/assets/js/services-data.js");
const TARGET = resolve(ROOT, "src/modules/services/content/categories.ts");

/**
 * Execute the reference IIFE read-only and return its RAW category list.
 *
 * The IIFE assigns window.SERVICE_CATS twice: first the raw array in file
 * order, then the ORDER-reordered array (the client-requested display order,
 * applied at render time here via constants/index.ts — we keep the raw order
 * in the content file, exactly as the existing file does). A Proxy captures the
 * FIRST assignment so the seed emits the raw order and stays a no-op against a
 * file that never changed.
 */
function loadReference() {
  const source = readFileSync(REFERENCE, "utf8");
  let raw = null;
  // The IIFE addresses the bare global `window`, which resolves to this
  // property of the sandbox — so the Proxy must wrap the inner object.
  const proxiedWindow = new Proxy(
    {},
    {
      set(target, property, value) {
        if (property === "SERVICE_CATS" && raw === null && Array.isArray(value)) raw = value;
        target[property] = value;
        return true;
      },
    },
  );
  const sandbox = { window: proxiedWindow };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "services-data.js (reference, read-only)" });
  if (!Array.isArray(raw) || raw.length === 0) throw new Error("reference produced no SERVICE_CATS");
  return raw;
}

/**
 * The reference's runtime ORDER, consulted here only for the `group` label.
 * The ARRAY ORDER is kept as-is from the reference file: display order is
 * applied at render time by constants/index.ts (SERVICE_CATEGORY_ORDER), which
 * mirrors the reference's own runtime reordering.
 */
const ORDER = { surg: ["gen", "plastic", "ortho", "uro", "eye", "ent", "gyn"], med: ["aes", "anes", "endo"] };

/** Reference shape → app shape. Values pass through untouched. */
function transcribe(reference) {
  const groupById = new Map();
  for (const [group, ids] of Object.entries(ORDER)) {
    for (const id of ids) groupById.set(id, group);
  }
  return reference.map((cat) => {
    const group = groupById.get(cat.id);
    if (group === undefined) throw new Error(`reference category "${cat.id}" is not covered by ORDER`);
    return {
      id: cat.id,
      ...(cat.img !== undefined ? { image: cat.img.replace(/^assets/, "") } : {}),
      icon: cat.icon,
      floor: cat.floor,
      group,
      name: { fa: cat.name.fa, en: cat.name.en, ar: cat.name.ar },
      description: { fa: cat.desc.fa, en: cat.desc.en, ar: cat.desc.ar },
      benefits: cat.benefits.map((benefit) => ({
        icon: benefit.i,
        title: { fa: benefit.t.fa, en: benefit.t.en, ar: benefit.t.ar },
      })),
      items: cat.items.map((item) => ({
        ...(item.img !== undefined ? { image: item.img.replace(/^assets/, "") } : {}),
        ...(item.icon !== undefined ? { icon: item.icon } : {}),
        name: { fa: item.n.fa, en: item.n.en, ar: item.n.ar },
        description: { fa: item.d.fa, en: item.d.en, ar: item.d.ar },
      })),
    };
  });
}

/** Structural sanity mirroring the Zod schema (schemas/index.ts). */
function validate(catalog) {
  const problems = [];
  for (const cat of catalog) {
    if (typeof cat.image !== "string" || !cat.image.startsWith("/img/")) {
      problems.push(`${cat.id}: category image must be a rebased /img/... path`);
    }
    for (const item of cat.items) {
      const hasImage = item.image !== undefined;
      const hasIcon = item.icon !== undefined;
      if (hasImage === hasIcon) problems.push(`${cat.id}: item must carry image XOR icon`);
    }
    for (const [field, value] of [
      ["name", cat.name],
      ["description", cat.description],
      ...cat.benefits.map((benefit, index) => [`benefit[${index}].title`, benefit.title]),
      ...cat.items.map((item, index) => [`item[${index}].name`, item.name]),
      ...cat.items.map((item, index) => [`item[${index}].description`, item.description]),
    ]) {
      for (const locale of ["fa", "en", "ar"]) {
        if (typeof value?.[locale] !== "string" || value[locale].length === 0) {
          problems.push(`${cat.id}: ${field}.${locale} missing or empty`);
        }
      }
    }
  }
  return problems;
}

/** Eval the LIVE .ts content file as plain JS (strip TS-only syntax) and return its array. */
function loadLive() {
  const source = readFileSync(TARGET, "utf8");
  const asJs = source
    .replace(/^\s*import\b[^;]*;/gm, "") // import type line — type-only
    .replace(/export\s+const\s+serviceCategories\s*:\s*[^=]*=\s*/, "const serviceCategories = ")
    .replace(/}\s*;?\s*$/s, "}"); // trailing `];` → keep; nothing else TS-specific
  const sandbox = {};
  vm.createContext(sandbox);
  // Take the completion value, not a sandbox property: a top-level `const`
  // binds in the script's global lexical environment and shadows any global
  // property of the same name.
  const result = vm.runInContext(`${asJs}\nserviceCategories;`, sandbox, {
    filename: "categories.ts (live, type-stripped)",
  });
  if (!Array.isArray(result)) throw new Error("live categories.ts did not evaluate to an array");
  return result;
}

/** Order-insensitive deep comparison for stable diffs. */
function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
  }
  return value;
}

/** Pretty-print the catalog as the typed content file (the file's canonical formatting). */
function serialize(catalog) {
  const quote = (value) => JSON.stringify(value);
  // Top-level texts spread one key per line; inline texts (benefit titles,
  // item name/description) stay compact on a single line.
  const locale = (text) =>
    `{\n      fa: ${quote(text.fa)},\n      en: ${quote(text.en)},\n      ar: ${quote(text.ar)},\n    }`;
  const localeInline = (text) => `{ fa: ${quote(text.fa)}, en: ${quote(text.en)}, ar: ${quote(text.ar)} }`;
  const benefit = (entry) => `      { icon: ${quote(entry.icon)}, title: ${localeInline(entry.title)} },`;
  const item = (entry) => {
    const media = entry.image !== undefined ? `image: ${quote(entry.image)}, ` : `icon: ${quote(entry.icon)}, `;
    return `      { ${media}name: ${localeInline(entry.name)}, description: ${localeInline(entry.description)} },`;
  };
  const lines = catalog.map((cat) => [
    "  {",
    `    id: ${quote(cat.id)},`,
    ...(cat.image !== undefined ? [`    image: ${quote(cat.image)},`] : []),
    `    icon: ${quote(cat.icon)},`,
    `    floor: ${cat.floor},`,
    `    group: ${quote(cat.group)},`,
    `    name: ${locale(cat.name)},`,
    `    description: ${locale(cat.description)},`,
    "    benefits: [",
    ...cat.benefits.map(benefit),
    "    ],",
    "    items: [",
    ...cat.items.map(item),
    "    ],",
    "  },",
  ]);
  return HEADER + "\n" + `export const serviceCategories: readonly ServiceCategory[] = [\n${lines.flat().join("\n")}\n];\n`;
}

const HEADER = `/**
 * content/categories.ts — the trilingual service catalog.
 *
 * GENERATED by scripts/seed-content.mjs from the reference
 * پلتفرم/assets/js/services-data.js (read-only — the single source of truth for
 * this data). Do not hand-edit catalog values: change the reference, then run
 * \`node scripts/seed-content.mjs --write\` (Phase 2, item 2 — the single
 * data-entry path for the catalog; see
 * docs/architecture/CONTENT_EDITING_WORKFLOW.md). Structural hand-edits of
 * presentation (grouping constants, etc.) belong in constants/index.ts.
 *
 * Provenance notes (deviations from the reference structure, none contentual):
 *   - The reference \`doc\` field pointed at a doctors.html anchor per category.
 *     Doctor pages are out of scope (REC-3, OPEN_QUESTIONS.md), so the field is
 *     not carried over and no doctor links are rendered from it.
 *   - The reference \`img\` paths ("assets/img/...") are rebased to the app's
 *     public root ("/img/..."); the files themselves were copied 1:1 into
 *     public/img/ (see docs/reports/ASSETS migration, A2).
 *   - Field names follow this repo's conventions: n → name, d → description,
 *     t (benefit) → title. Values are unchanged.
 *   - The reference assigns group + final display order via ORDER at runtime;
 *     the same assignments are baked in here (see constants/index.ts).
 *
 * fa is canonical; en/ar are the reference's own translations, checked for
 * completeness by LocaleTextSchema (schemas/index.ts) and for parity against
 * the reference by categories.test.ts.
 */

import type { ServiceCategory } from "../types";`;

// --- run --------------------------------------------------------------------

const catalog = transcribe(loadReference());
const sanityProblems = validate(catalog);
if (sanityProblems.length > 0) {
  console.error("seed: reference-derived catalog fails its own structural checks:");
  for (const problem of sanityProblems) console.error(`  → ${problem}`);
  process.exit(1);
}

if (process.argv.includes("--write")) {
  writeFileSync(TARGET, serialize(catalog), "utf8");
  console.log(`seed: wrote ${catalog.length} categories → ${TARGET.split(/[\\/]/).slice(-3).join("/")}`);
  process.exit(0);
}

// Check mode: structural comparison of the live file vs the reference.
const live = loadLive();
const a = JSON.stringify(normalize(live));
const b = JSON.stringify(normalize(catalog));

if (live.length !== catalog.length) {
  console.error(`seed: drift — live file has ${live.length} categories, reference yields ${catalog.length}`);
  process.exit(1);
}
for (let index = 0; index < catalog.length; index += 1) {
  const liveJson = JSON.stringify(normalize(live[index]));
  const refJson = JSON.stringify(normalize(catalog[index]));
  if (liveJson !== refJson) {
    console.error(`seed: drift in category "${catalog[index].id}" (index ${index})`);
    console.error(`  live     : ${liveJson.slice(0, 300)}…`);
    console.error(`  reference: ${refJson.slice(0, 300)}…`);
    process.exit(1);
  }
}
console.log(
  `PASS: catalog in sync — ${catalog.length} categories × 3 locales, ` +
    `${catalog.reduce((sum, cat) => sum + cat.items.length, 0)} sub-services, ` +
    `all field values identical to پلتفرم/assets/js/services-data.js`,
);
process.exit(0);
