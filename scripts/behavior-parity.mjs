// B-6/B-7 live behavior probe on the final build: the micro-interactions the
// reference demo performs, verified mechanistically (not by eye), with the
// same measurements taken on the reference demo itself for direct comparison.
//
// Probe-note (why the naive synthetic events fail): the magnetic island
// listens for `mousemove`, and a synthetic in-page `PointerEvent` does NOT
// fire it — a real `Input.dispatchMouseEvent` is required; the chevron
// rotation lives on `.has-sub.open .sub-tg svg` (parent LI's class), not on
// the button; the spy tracks only the links whose hash resolves on-page.
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
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }, { name: "prefers-color-scheme", value: "light" }] });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const out = [];
  const check = (name, value, ok = true) => { out.push((ok ? "ok   " : "WARN ") + name + ": " + value); };

  // ---------------- live build, home @1280 ----------------
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `${ORIGIN}/?lang=fa` });
  await sleep(2800);

  check("hero .h-slogan final opacity", await ev(`getComputedStyle(document.querySelector(".h-slogan")).opacity`));
  check("scroll-progress present", await ev(`document.querySelector(".scroll-progress") !== null`));
  check("live-dot animation", await ev(`(()=>{const s=getComputedStyle(document.querySelector(".live-dot"));return s.animationName+" "+s.animationDuration+" "+s.animationPlayState;})()`));
  check("hw-n numeral (content:attr(data-n))", await ev(`(()=>{const n=document.querySelector(".hw-n[data-n]");const cs=getComputedStyle(n,"::before");return JSON.stringify({attr:n.getAttribute("data-n"),painted:cs.content,w:Math.round(n.getBoundingClientRect().width)});})()`));
  check("hst-i icon painted", await ev(`(()=>{const r=document.querySelector(".hst-i svg").getBoundingClientRect();return JSON.stringify({w:Math.round(r.width),h:Math.round(r.height)});})()`));
  check("footer", await ev(`(()=>{const f=document.querySelector("footer");const p=f.querySelector("a[href^='tel:']");const cs=getComputedStyle(p);return JSON.stringify({brandMark:f.querySelector("svg")!==null,phoneAnim:cs.animationName+" "+cs.animationDuration});})()`));

  // Magnetic: armed marker + real CDP mousemove → inline translate.
  // NOTE: run before any scroll — the header is position:absolute and scrolls
  // away (the reference's .stuck is a no-op), so a mouse event dispatched at
  // the (now offscreen) header CTA hit-tests something else entirely.
  check("magnetic armed", await ev(`document.querySelectorAll(".btn-primary.magnetic").length + "/" + document.querySelectorAll(".btn-primary").length`));
  const mag = JSON.parse(await ev(`(()=>{const b=document.querySelector(".btn-primary");const r=b.getBoundingClientRect();return JSON.stringify({x:r.left+r.width*0.75,y:r.top+r.height*0.75});})()`));
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: mag.x, y: mag.y });
  await sleep(250);
  check("magnetic after real mousemove", await ev(`(()=>{const b=document.querySelector(".btn-primary");return "inline="+b.style.transform+" computed="+getComputedStyle(b).transform;})()`));

  // MenuSpy: home active at top, contact active at #contact (the only on-page hash)
  const spyState = () => ev(`JSON.stringify([...document.querySelectorAll("#menu a")].map(a=>({active:a.classList.contains("active"),txt:a.textContent.trim().slice(0,12)})))`);
  check("nav spy @top", await spyState());
  await ev(`document.getElementById("contact").scrollIntoView({behavior:"instant"})`);
  await sleep(600);
  check("nav spy @contact", await spyState());

  // ---------------- accordion + chevron @960, live vs reference ----------------
  const chevState = () => ev(`(()=>{const li=document.querySelector(".has-sub");const svg=li.querySelector(".sub-tg svg");
    return JSON.stringify({li:li.className,sub:getComputedStyle(li.querySelector(".sub")).display,chev:getComputedStyle(svg).transform});})()`);
  await send("Emulation.setDeviceMetricsOverride", { width: 960, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `${ORIGIN}/?lang=fa` });
  await sleep(2400);
  await ev(`document.querySelector('button[aria-controls="menu"]').click()`);
  await sleep(400);
  check("cur panel @960", await ev(`document.getElementById("menu").className`));
  check("cur chev closed", await chevState());
  await ev(`document.querySelector("button.sub-tg").click()`);
  await sleep(400);
  check("cur chev open", await chevState());

  await send("Page.navigate", { url: REF });
  await sleep(2400);
  await ev(`document.querySelector(".burger").click()`);
  await sleep(400);
  check("REF chev closed", await chevState());
  await ev(`document.querySelector(".sub-tg").click()`);
  await sleep(400);
  check("REF chev open", await chevState());

  console.log(out.join("\n"));
  ws.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
