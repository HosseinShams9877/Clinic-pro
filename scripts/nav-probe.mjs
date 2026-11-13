// One-shot probe: why does the live build's header .nav measure 1140px where
// the reference measures 1200px? Walks the ancestor chain and reports widths.
const CDP = "http://127.0.0.1:9333";
const ORIGIN = "http://localhost:3137";
const REF = "file:///D:/New%20folder/Clinic-pro/%D9%BE%D9%84%D8%AA%D9%81%D8%B1%D9%85/index.html?lang=fa";

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
    if (res.exceptionDetails) return "EXC: " + (res.exceptionDetails.exception?.description?.slice(0, 200) ?? "?");
    return res?.result?.result?.value ?? res?.result?.value;
  };
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });

  const WALK = `(() => {
    const nav = document.querySelector(".nav");
    const rows = [];
    let el = nav;
    while (el && rows.length < 8) {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      rows.push(el.tagName + "." + (el.className.baseVal !== undefined ? "svg" : String(el.className).split(" ").join(".")) +
        " | w=" + Math.round(r.width) + " x=" + Math.round(r.x) +
        " maxW=" + s.maxWidth + " pad=" + s.padding + " disp=" + s.display);
      el = el.parentElement;
    }
    return rows.join("\\n          ");
  })()`;

  for (const [url, tag] of [[REF, "REF"], [`${ORIGIN}/?lang=fa`, "CUR"]]) {
    await send("Page.navigate", { url });
    await new Promise((r) => setTimeout(r, 2400));
    console.log(`\n===== ${tag} (innerW ${await ev("innerWidth")} scrollW ${await ev("document.documentElement.scrollWidth")}) =====`);
    console.log("          " + (await ev(WALK)));
    console.log("  .container count: " + await ev(`document.querySelectorAll(".container").length`));
    console.log("  --container resolved on body: " + await ev(`getComputedStyle(document.body).getPropertyValue("--container")`));
    // hero columns
    console.log("  hero grid: " + await ev(`(()=>{const g=document.querySelector(".h-hero-in, .hero-grid");if(!g)return "none";const s=getComputedStyle(g);return s.gridTemplateColumns+" gap="+s.gap+" pad="+s.padding;})()`));
    console.log("  hero p rule check: " + await ev(`(()=>{const p=document.querySelector(".h-copy p");const m=getComputedStyle(p);return "font="+m.fontSize+" lh="+m.lineHeight+" maxW="+m.maxWidth+" w="+Math.round(p.getBoundingClientRect().width);})()`));
    console.log("  hero h1 font: " + await ev(`(()=>{const h=document.querySelector(".h-slogan");const s=getComputedStyle(h);return s.fontFamily.slice(0,60)+" @ "+s.fontSize;})()`));
  }
  ws.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
