/**
 * Import the publishable public-site content from a read-only reference tree.
 *
 * Usage:
 *   node scripts/import-public-reference.mjs <reference-root>
 *
 * The script deliberately ignores every panel/admin file. It copies public
 * images and the reference's page CSS verbatim, then serializes the verified
 * doctors, guide and static-page content for framework-native rendering.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.resolve(projectRoot, process.argv[2] || "پلتفرم");
const outputRoot = path.join(projectRoot, "src", "modules", "publicSite", "content");
const cssOutputRoot = path.join(projectRoot, "src", "styles", "referencePublic");
const imageOutputRoot = path.join(projectRoot, "public", "img");

const publicStaticPages = {
  about: "about.html",
  clinics: "clinics.html",
  visiting: "visiting.html",
  patientRights: "patient-rights.html",
  admission: "admission.html",
  internationalPatients: "international-patients.html",
};

const publicCssFiles = [
  "doctors.css",
  "doctor.css",
  "guide.css",
  "info.css",
  "about-page.css",
  "admission-refresh.css",
  "visiting-page.css",
  "patient-pages.css",
  "layout-refinement.css",
];

const blockedHrefPrefixes = [
  "doctor-panel.html",
  "doctor-income.html",
  "patient-panel.html",
  "secretary-panel.html",
  "surgery-panel.html",
  "staff-panel.html",
  "finance-panel.html",
  "insurance-panel.html",
  "quality-panel.html",
  "platform.html",
];

const routeRewrites = [
  [/^index\.html(?=$|#)/, "/"],
  [/^about\.html(?=$|#)/, "/about"],
  [/^services\.html(?=$|#)/, "/services"],
  [/^surgical-services\.html(?=$|#)/, "/services/surgical"],
  [/^medical-services\.html(?=$|#)/, "/services/medical"],
  [/^doctors\.html(?=$|[?#])/, "/doctors"],
  [/^guide\.html(?=$|[?#])/, "/guide"],
  [/^clinics\.html(?=$|#)/, "/clinics"],
  [/^visiting\.html(?=$|#)/, "/visiting"],
  [/^patient-rights\.html(?=$|#)/, "/patient-rights"],
  [/^admission\.html(?=$|#)/, "/admission"],
  [/^international-patients\.html(?=$|#)/, "/international-patients"],
  [/^loan\.html(?=$|#)/, "/loan"],
];

function assertSource() {
  for (const relative of [
    "assets/js/doctors-data.js",
    "assets/js/doctor-profiles.js",
    "assets/js/guide-data.js",
    "assets/js/i18n.js",
    "assets/js/i18n-extra.js",
  ]) {
    if (!fs.existsSync(path.join(sourceRoot, relative))) {
      throw new Error(`Missing reference input: ${relative}`);
    }
  }
}

function read(relative) {
  return fs.readFileSync(path.join(sourceRoot, relative), "utf8");
}

function evaluateWindow(relativeFiles) {
  const context = { window: {}, console };
  vm.createContext(context);
  for (const relative of relativeFiles) {
    vm.runInContext(read(relative), context, { filename: relative });
  }
  return context.window;
}

function rebaseImages(value) {
  return JSON.parse(JSON.stringify(value).replaceAll("assets/img/", "/img/"));
}

function localized(value, locale) {
  if (!value || typeof value !== "object") return "";
  return value[locale] || value.fa || "";
}

function rewriteHref(href, profileIds) {
  if (!href || href.startsWith("#") || /^(?:https?:|mailto:|tel:)/.test(href)) return href;

  if (href.startsWith("assistant.html")) return null;
  if (blockedHrefPrefixes.some((prefix) => href.startsWith(prefix))) return null;

  const doctorMatch = href.match(/^doctor\.html\?id=([^&#]+)/);
  if (doctorMatch) {
    const id = decodeURIComponent(doctorMatch[1]);
    return profileIds.has(id) ? `/doctors/${encodeURIComponent(id)}` : "/doctors";
  }

  const guideMatch = href.match(/^guide-item\.html\?id=([^&#]+)/);
  if (guideMatch) return `/guide/${encodeURIComponent(decodeURIComponent(guideMatch[1]))}`;

  let next = href;
  for (const [pattern, replacement] of routeRewrites) next = next.replace(pattern, replacement);
  return next;
}

function sanitizeDocument(document, profileIds) {
  document.querySelectorAll(".ix-cta").forEach((cta) => {
    const assistantLink = cta.querySelector('a[href^="assistant.html"]');
    if (!assistantLink) return;
    assistantLink.remove();
    // The paragraph promises answers from the explicitly blocked demo
    // assistant. Keep the reference's real call-to-admissions action, but do
    // not publish that unavailable promise or rewrite it with new copy.
    cta.querySelector(".ix-cta-t p")?.remove();
  });

  document.querySelectorAll("img[src]").forEach((image) => {
    const source = image.getAttribute("src");
    if (source?.startsWith("assets/img/")) image.setAttribute("src", `/${source.replace(/^assets\//, "")}`);
  });

  document.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href") || "";
    const rewritten = rewriteHref(href, profileIds);
    if (rewritten) {
      anchor.setAttribute("href", rewritten);
      return;
    }

    // Public pages sometimes expose demo portal actions. Preserve the real
    // explanatory copy, but never ship a fake or forbidden destination.
    if (href.startsWith("patient-panel.html?go=new")) {
      anchor.setAttribute("href", "tel:+983155154000");
      return;
    }
    anchor.remove();
  });

  document.querySelectorAll("[onclick]").forEach((element) => element.removeAttribute("onclick"));
}

function normalizeAccessibility(document, pageKey) {
  const breadcrumb = document.querySelector("main .crumbs");
  const current = breadcrumb?.querySelector("b");
  if (breadcrumb && current) {
    const labelId = `${pageKey}-breadcrumb-label`;
    current.id = labelId;
    breadcrumb.removeAttribute("aria-label");
    breadcrumb.setAttribute("aria-labelledby", labelId);
  }

  if (pageKey === "patientRights") {
    document.querySelectorAll('main h3[data-i18n^="ir."]').forEach((heading) => {
      const replacement = document.createElement("h2");
      for (const attribute of heading.attributes) {
        replacement.setAttribute(attribute.name, attribute.value);
      }
      replacement.innerHTML = heading.innerHTML;
      heading.replaceWith(replacement);
    });
  }
}

function fillAnesthesiologists(document, locale, doctors, profiles) {
  const box = document.getElementById("anesDrs");
  if (!box) return;

  box.innerHTML = doctors
    .filter((doctor) => doctor.cat === "anes")
    .map((doctor) => {
      const name = localized(doctor.name, locale);
      const specialty = localized(doctor.spec, locale);
      const initial = (doctor.name.fa || "").replace(/^دکتر\s*/, "").charAt(0);
      const avatar = doctor.photo
        ? `<span class="av" style="background-image:url(${doctor.photo})"></span>`
        : `<span class="av">${initial}</span>`;
      const href = profiles[doctor.id] ? `/doctors/${encodeURIComponent(doctor.id)}` : "/doctors?cat=anes";
      return `<a class="ix-dr" href="${href}">${avatar}<div><b>${name}</b><small>${specialty}</small></div></a>`;
    })
    .join("");
}

function translateDocument(document, locale, translations) {
  if (locale === "fa") return;
  const messages = translations[locale] || {};
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (key && messages[key] != null) element.textContent = messages[key];
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((element) => {
    const key = element.getAttribute("data-i18n-ph");
    if (key && messages[key] != null) element.setAttribute("placeholder", messages[key]);
  });
}

function serializeStaticPage(pageKey, file, locale, translations, doctors, profiles) {
  const dom = new JSDOM(read(file));
  const { document } = dom.window;
  translateDocument(document, locale, translations);
  fillAnesthesiologists(document, locale, doctors, profiles);
  sanitizeDocument(document, new Set(Object.keys(profiles)));
  normalizeAccessibility(document, pageKey);
  const main = document.querySelector("main");
  if (!main) throw new Error(`Missing <main> in ${file}`);
  return {
    html: main.innerHTML.trim(),
    className: main.getAttribute("class") || "",
    lang: main.getAttribute("lang") || "",
    dir: main.getAttribute("dir") || "",
  };
}

function hashFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function writeJson(name, value) {
  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(path.join(outputRoot, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function copyAssets() {
  fs.mkdirSync(imageOutputRoot, { recursive: true });
  fs.cpSync(path.join(sourceRoot, "assets", "img"), imageOutputRoot, {
    recursive: true,
    force: true,
  });

  fs.mkdirSync(cssOutputRoot, { recursive: true });
  for (const file of publicCssFiles) {
    fs.copyFileSync(path.join(sourceRoot, "assets", "css", file), path.join(cssOutputRoot, file));
  }
}

assertSource();

const doctorsWindow = evaluateWindow(["assets/js/doctors-data.js"]);
const profilesWindow = evaluateWindow(["assets/js/doctor-profiles.js"]);
const guideWindow = evaluateWindow(["assets/js/guide-data.js"]);
const translationWindow = evaluateWindow(["assets/js/i18n.js", "assets/js/i18n-extra.js"]);

const doctors = rebaseImages(doctorsWindow.DOCTORS);
const doctorCategories = doctorsWindow.DOCTOR_CATS;
const importedDoctorProfiles = rebaseImages(profilesWindow.DOCTOR_PROFILES);
const doctorProfiles = Object.fromEntries(
  Object.entries(importedDoctorProfiles).map(([id, profile]) => [
    id,
    {
      ...profile,
      // The source marks education and most service lists TODO pending each
      // doctor's confirmation. Only Farajipour's first three services are
      // explicitly sourced from the official site; all unconfirmed fields
      // stay out of the publishable payload.
      services: id === "farajipour" ? (profile.services || []).slice(0, 3) : [],
      creds: [],
    },
  ]),
);
const guide = rebaseImages({
  categories: guideWindow.GUIDE_CATS,
  common: {
    ...guideWindow.GUIDE_COMMON,
    // The reference labels these assets "soon" / "in production". They are
    // placeholders, not publishable content.
    videos: { pre: [], post: [] },
    audio: [],
  },
  surgeries: guideWindow.GUIDE_SURGERIES,
});
const translations = translationWindow.I18N;

const staticPages = {};
for (const [key, file] of Object.entries(publicStaticPages)) {
  const sourceDom = new JSDOM(read(file));
  const sprite = sourceDom.window.document.querySelector('body > svg[width="0"]');
  staticPages[key] = {
    bodyClassName: sourceDom.window.document.body.className,
    title: sourceDom.window.document.querySelector("title")?.textContent || "",
    description:
      sourceDom.window.document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
    faOnly: key === "internationalPatients",
    sprite: sprite?.outerHTML || "",
    fa: serializeStaticPage(key, file, "fa", translations, doctors, doctorProfiles),
    en: serializeStaticPage(key, file, "en", translations, doctors, doctorProfiles),
    ar: serializeStaticPage(key, file, "ar", translations, doctors, doctorProfiles),
  };
}

writeJson("doctors.json", { categories: doctorCategories, doctors });
writeJson("doctor-profiles.json", doctorProfiles);
writeJson("guide.json", guide);
writeJson("reference-translations.json", translations);
writeJson("static-pages.json", staticPages);
writeJson("reference-manifest.json", {
  importedAt: "2026-11-23",
  sourceFileCount: fs.readdirSync(sourceRoot, { recursive: true }).filter((entry) => {
    const full = path.join(sourceRoot, String(entry));
    return fs.existsSync(full) && fs.statSync(full).isFile();
  }).length,
  inputs: Object.fromEntries(
    [
      ...Object.values(publicStaticPages),
      "assets/js/doctors-data.js",
      "assets/js/doctor-profiles.js",
      "assets/js/guide-data.js",
      "assets/js/i18n.js",
      "assets/js/i18n-extra.js",
      ...publicCssFiles.map((file) => `assets/css/${file}`),
    ].map((relative) => [relative, hashFile(path.join(sourceRoot, relative))]),
  ),
  counts: {
    doctors: doctors.length,
    doctorProfiles: Object.keys(doctorProfiles).length,
    guideItems: guide.surgeries.length,
    staticPages: Object.keys(staticPages).length,
  },
});
copyAssets();

console.log(
  JSON.stringify({
    sourceRoot,
    doctors: doctors.length,
    doctorProfiles: Object.keys(doctorProfiles).length,
    guideItems: guide.surgeries.length,
    staticPages: Object.keys(staticPages).length,
    cssFiles: publicCssFiles.length,
  }),
);
