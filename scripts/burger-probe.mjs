// One-off: why is the burger not focusable at 375px?
import { writeFileSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";

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
    if (res.exceptionDetails) return JSON.stringify({ EXC: res.exceptionDetails.exception?.description?.slice(0, 300) });
    const v = res?.result?.result?.value ?? res?.result?.value;
    return typeof v === "string" ? v : JSON.stringify(v);
  };

  await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 800, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: "http://localhost:3137/" });
  await new Promise((r) => setTimeout(r, 2500));

  const act = `(() => { const a = document.activeElement;
    if (!a || a === document.body) return "BODY";
    return a.tagName + "." + (typeof a.className === "string" ? a.className : "") + "|" + (a.textContent||"").trim().slice(0,18); })()`;

  const tab = async (forward) => {
    if (!forward) await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Shift", code: "ShiftLeft", windowsVirtualKeyCode: 16 });
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    if (!forward) await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Shift", code: "ShiftLeft", windowsVirtualKeyCode: 16 });
  };

  // exact gate sequence
  await ev(`document.querySelector('button[aria-controls="menu"]').focus()`);
  console.log("1 focus:", await ev(act));
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await new Promise((r) => setTimeout(r, 250));
  console.log("2 after Enter:", await ev(act), "| menuClass:", await ev(`document.getElementById("menu").className`));
  await tab(false);
  await new Promise((r) => setTimeout(r, 120));
  console.log("3 after shift+tab:", await ev(act));
  await tab(false);
  await new Promise((r) => setTimeout(r, 120));
  console.log("4 after 2nd shift+tab:", await ev(act));
  await tab(false);
  await new Promise((r) => setTimeout(r, 120));
  console.log("5 after 3rd shift+tab:", await ev(act));
  ws.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
