// One-off: dump the 320px header geometry on /?lang=en vs ar vs fa.
// Usage: node scripts/overflow-diagnose.mjs
import { writeFileSync } from "node:fs";

const CDP = "http://127.0.0.1:9333";
const BASE = "http://localhost:3137";

async function main() {
  const targets = await (await fetch(`${CDP}/json/list`)).json();
  let page = targets.find((t) => t.type === "page");
  if (!page) {
    await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" });
    const list2 = await (await fetch(`${CDP}/json/list`)).json();
    page = list2.find((t) => t.type === "page");
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((res) => {
      const i = ++id;
      pending.set(i, res);
      ws.send(JSON.stringify({ id: i, method, params }));
    });

  const out = {};
  for (const loc of ["en", "ar", "fa"]) {
    await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 900, deviceScaleFactor: 1, mobile: true });
    await send("Page.navigate", { url: `${BASE}/?lang=${loc}` });
    await new Promise((r) => setTimeout(r, 2500));
    const res = await send("Runtime.evaluate", {
      expression: `(() => {
        const nav = document.querySelector('.nav');
        const tools = document.querySelector('.nav-tools');
        const brand = document.querySelector('.brand');
        const kids = tools ? [...tools.children].map(c => ({
          cls: c.className,
          disp: getComputedStyle(c).display,
          w: Math.round(c.getBoundingClientRect().width),
          right: Math.round(c.getBoundingClientRect().right)
        })) : [];
        const menuDisp = getComputedStyle(document.querySelector('.menu')).display;
        const menuPos = getComputedStyle(document.querySelector('.menu')).position;
        return JSON.stringify({
          innerWidth: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          nav: { w: Math.round(nav.getBoundingClientRect().width), right: Math.round(nav.getBoundingClientRect().right) },
          containerW: Math.round(document.querySelector('.container').getBoundingClientRect().width),
          headerW: Math.round(document.querySelector('.site-header').getBoundingClientRect().width),
          brand: { w: Math.round(brand.getBoundingClientRect().width), right: Math.round(brand.getBoundingClientRect().right) },
          tools: { w: Math.round(tools.getBoundingClientRect().width), right: Math.round(tools.getBoundingClientRect().right), disp: getComputedStyle(tools).display, margin: getComputedStyle(tools).marginInlineStart },
          kids,
          menuDisp, menuPos,
          navGap: getComputedStyle(nav).gap,
          navPadding: getComputedStyle(nav).paddingInline
        }, null, 1);
      })()`,
      returnByValue: true,
      awaitPromise: true,
    });
    if (!res || !res.result || typeof res.result.value !== "string") {
      out[loc] = { RAW: JSON.stringify(res)?.slice(0, 800) };
      continue;
    }
    if (res.exceptionDetails) { out[loc] = { ERROR: res.exceptionDetails }; continue; }
    out[loc] = JSON.parse(res.result.value);
  }
  writeFileSync("docs/reports/overflow-diagnose.json", JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
  ws.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
