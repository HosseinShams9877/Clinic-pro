// One-off: trace the real Tab walk at 1440px on /?lang=fa to find where focus is lost.
import { writeFileSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const URL_ = "http://localhost:3137/?lang=fa";

async function main() {
  const targets = await (await fetch(`${CDP}/json/list`)).json();
  let page = targets.find((t) => t.type === "page");
  if (!page) { await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" }); page = (await (await fetch(`${CDP}/json/list`)).json()).find((t) => t.type === "page"); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (m, p = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true }))?.result?.result?.value;

  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: URL_ });
  await new Promise((r) => setTimeout(r, 1500));

  const rest = await ev(`(() => {
    const selector = "a[href], area[href], button:not([disabled]), input:not([disabled]):not([type='hidden']), select:not([disabled]), textarea:not([disabled]), iframe, summary:not([tabindex='-1']), [contenteditable]:not([contenteditable='false']), [tabindex]:not([tabindex='-1']), video[controls], audio[controls]";
    const out = [];
    for (const el of document.querySelectorAll(selector)) {
      if (el.getAttribute("tabindex") === "-1") continue;
      if (el.closest("[aria-hidden='true']")) continue;
      const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
      const shown = s.visibility !== "hidden" && s.display !== "none";
      if (r.width > 0 && shown) out.push(el.tagName + "." + (typeof el.className === "string" ? el.className : "").slice(0,50) + "|" + (el.textContent||"").trim().slice(0,25) + "|" + el.getAttribute("href"));
    }
    return JSON.stringify(out);
  })()`);
  const restList = JSON.parse(rest);
  console.log("REST-TABBABLE:", restList.length);
  console.log(restList.join("\n"));

  // Tab walk with trace
  for (let step = 0; step < restList.length + 6; step++) {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await new Promise((r) => setTimeout(r, 60));
    const act = await ev(`(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return "BODY";
      const s = getComputedStyle(a);
      return a.tagName + "." + (typeof a.className === "string" ? a.className : "").slice(0,50) + "|" + (a.textContent||"").trim().slice(0,25) + "|" + a.getAttribute("href") + " vis=" + s.visibility + " disp=" + s.display;
    })()`);
    console.log(`step ${step}: ${act}`);
  }
  ws.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
