// One-off: measure the REFERENCE demo header at 320px in en/ar/fa.
// Ground truth for the 320px overflow question (B-7 / overflow gate).
import { writeFileSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const REF = "file:///D:/New%20folder/Clinic-pro/%D9%BE%D9%84%D8%AA%D9%81%D8%B1%D9%85/index.html";

async function main() {
  const targets = await (await fetch(`${CDP}/json/list`)).json();
  let page = targets.find((t) => t.type === "page");
  if (!page) {
    await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" });
    page = (await (await fetch(`${CDP}/json/list`)).json()).find((t) => t.type === "page");
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

  await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: REF });
  await new Promise((r) => setTimeout(r, 2000));

  const dump = async (loc) => {
    const res = await send("Runtime.evaluate", {
      expression: `(() => {
        const nav = document.querySelector('.nav'), tools = document.querySelector('.nav-tools'), brand = document.querySelector('.brand');
        return JSON.stringify({
          dir: document.documentElement.dir,
          innerWidth: innerWidth, scrollWidth: document.documentElement.scrollWidth,
          nav: { w: Math.round(nav.getBoundingClientRect().width) },
          brand: { w: Math.round(brand.getBoundingClientRect().width) },
          tools: { w: Math.round(tools.getBoundingClientRect().width), right: Math.round(tools.getBoundingClientRect().right) },
          kids: [...tools.children].map(c => ({ cls: c.className, disp: getComputedStyle(c).display, w: Math.round(c.getBoundingClientRect().width), right: Math.round(c.getBoundingClientRect().right) })),
          langLabel: document.getElementById('langLabel')?.textContent
        });
      })()`,
      returnByValue: true,
    });
    return res?.result?.value ? JSON.parse(res.result.value) : { RAW: JSON.stringify(res).slice(0, 500) };
  };

  const out = {};
  out.fa = await dump("fa");
  // switch to en via the reference's own lang switcher
  await send("Runtime.evaluate", { expression: `document.querySelector('.lang-list button[data-lang="en"]').click()`, returnByValue: true });
  await new Promise((r) => setTimeout(r, 800));
  out.en = await dump("en");
  await send("Runtime.evaluate", { expression: `document.querySelector('.lang-list button[data-lang="ar"]').click()`, returnByValue: true });
  await new Promise((r) => setTimeout(r, 800));
  out.ar = await dump("ar");
  writeFileSync("docs/reports/overflow-ref-measure.json", JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
  ws.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
