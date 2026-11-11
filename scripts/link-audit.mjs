/**
 * link-audit.mjs — crawl every in-scope route of the RUNNING production server
 * and assert every <a> link target is inside the implementation boundary
 * (P1-15 gate).
 *
 * Allowed anchors:
 *   - internal routes (/, /services, /services/<id>), incl. #hash and ?lang=
 *   - tel: / mailto:
 *   - the two reference-sanctioned externals (verified verbatim in
 *     پلتفرم/index.html): the Google Maps directions search and instagram.com.
 * Head <link> tags (canonical, hreflang alternates, _next assets) are NOT
 * anchors and are excluded; they are verified separately by the SEO tests.
 * Usage: node scripts/link-audit.mjs <http://origin>
 */
const ORIGIN = process.argv[2] ?? "http://localhost:3137";
const INTERNAL_PATHS = [
  "/",
  "/services",
  "/services/gen",
  "/services/plastic",
  "/services/ortho",
  "/services/uro",
  "/services/eye",
  "/services/ent",
  "/services/gyn",
  "/services/aes",
  "/services/anes",
  "/services/endo",
];

const SANCTIONED_EXTERNS = [
  "https://www.google.com/maps/search/?api=1&query=Kashan+Amir+Kabir+Street+Dr+Kheirkhah+Surgical+Center",
  "https://instagram.com",
];

const isAllowed = (href) => {
  if (href.startsWith("tel:") || href.startsWith("mailto:")) return true;
  if (SANCTIONED_EXTERNS.includes(href.replace(/&amp;/g, "&"))) return true;
  let url;
  try {
    url = new URL(href, ORIGIN);
  } catch {
    return false;
  }
  if (url.origin !== new URL(ORIGIN).origin) return false;
  if (!INTERNAL_PATHS.includes(url.pathname)) return false;
  if (url.search !== "" && !/^\?lang=(fa|en|ar)$/.test(url.search)) return false;
  return true;
};

const ROUTES = INTERNAL_PATHS;
const problems = [];
for (const route of ROUTES) {
  const html = await (await fetch(ORIGIN + route)).text();
  // Only <a> tags — head <link rel=canonical/alternate> are not navigation.
  const hrefs = [...html.matchAll(/<a\b[^>]*?href="([^"]*)"/g)].map((m) => m[1]);
  const uniq = [...new Set(hrefs)];
  const bad = uniq.filter((href) => !isAllowed(href));
  if (bad.length) problems.push({ route, bad });
  console.log(`${bad.length === 0 ? "ok  " : "FAIL"}  ${route}  anchors=${hrefs.length} unique=${uniq.length} outOfScope=${bad.length}`);
  for (const b of bad) console.log(`        → ${b}`);
}

console.log(`\n${problems.length === 0 ? "PASS" : "FAIL"}: anchor boundary audit over ${ROUTES.length} routes`);
process.exit(problems.length === 0 ? 0 : 1);
