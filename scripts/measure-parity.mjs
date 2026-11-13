// B-7 final parity measurement: the same selectors measured on the reference
// demo (file://) and the live build, at 1280px and 393px, fa/RTL. Geometry in
// device px; font/radius/border/shadow as computed values. A diff of 0 (or the
// documented token swap) is the mechanical statement of "pixel match".
const CDP = "http://127.0.0.1:9333";
const ORIGIN = "http://localhost:3137";
const REF = "file:///D:/New%20folder/Clinic-pro/%D9%BE%D9%84%D8%AA%D9%81%D8%B1%D9%85/index.html?lang=fa";

const ITEMS = [
  ["brand", ".brand"],
  ["nav", ".nav"],
  ["burger", ".burger"],
  ["hero h1", ".h-slogan"],
  ["hero p", ".h-copy p"],
  ["hero cta", ".h-cta .btn-primary"],
  ["hst-i", ".hst-i"],
  ["hw-n", ".hw-n"],
  ["steps summary", ".hst summary, details summary"],
  ["footer phone", ".foot-phone, footer a[href^='tel:']"],
];

const MEASURE = `((sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const s = getComputedStyle(el);
  return JSON.stringify({
    x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
    font: s.fontSize + "/" + s.lineHeight + " " + s.fontWeight,
    fam: s.fontFamily.split(",")[0].trim().slice(0, 24),
    radius: s.borderRadius,
    shadow: s.boxShadow === "none" ? "none" : s.boxShadow.slice(0, 40),
    bg: s.backgroundColor,
    color: s.color,
    pad: s.padding,
  });
})`;

async function main() {
  const targets = await (await fetch(`${CDP}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (m, p = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  const ev = async (expr) => {
    const res = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
    if (res.exceptionDetails) return "EXC";
    return res?.result?.result?.value ?? res?.result?.value;
  };
  await send("Page.enable");
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }, { name: "prefers-color-scheme", value: "light" }] });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  for (const w of [1280, 393]) {
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: w === 1280 ? 900 : 852, deviceScaleFactor: 1, mobile: false });
    const rows = {};
    for (const [url, tag] of [[REF, "ref"], [`${ORIGIN}/?lang=fa`, "cur"]]) {
      await send("Page.navigate", { url });
      await sleep(2400);
      rows[tag] = {};
      for (const [name, sel] of ITEMS) {
        rows[tag][name] = JSON.parse((await ev(`${MEASURE}(${JSON.stringify(sel)})`)) ?? "null");
      }
      rows[tag]._scrollW = Number(await ev(`document.documentElement.scrollWidth`));
    }
    console.log(`\n===== ${w}px (scrollWidth ref=${rows.ref._scrollW} cur=${rows.cur._scrollW}) =====`);
    for (const [name] of ITEMS) {
      const a = rows.ref[name], b = rows.cur[name];
      if (!a || !b) { console.log(`${name}: ${a ? "ref only" : b ? "cur only" : "both ABSENT"}`); continue; }
      const diffs = Object.keys(a).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
      console.log(`${diffs.length === 0 ? "SAME " : "DIFF "} ${name}${diffs.length ? " → " + diffs.map((k) => `${k}: ref=${JSON.stringify(a[k])} cur=${JSON.stringify(b[k])}`).join(" | ") : ""}`);
    }
  }
  ws.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
