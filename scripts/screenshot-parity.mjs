// B-7 evidence: side-by-side reference demo vs the live build.
// 4 pairs: home and /services/gen at 1280px and 393px, fa/RTL (canonical).
// The reference services page is one page whose chips drive #sDetail, so the
// category pair selects the gen chip first (the reference's own interaction).
import { writeFileSync } from "node:fs";
const CDP = "http://127.0.0.1:9333";
const REF_INDEX = "file:///D:/New%20folder/Clinic-pro/%D9%BE%D9%84%D8%AA%D9%81%D8%B1%D9%85/index.html?lang=fa";
const REF_SERVICES = "file:///D:/New%20folder/Clinic-pro/%D9%BE%D9%84%D8%AA%D9%81%D8%B1%D9%85/services.html?lang=fa";
const ORIGIN = "http://localhost:3137";
const OUT = "docs/reports/screenshots";

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
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description?.slice(0, 300));
    return res?.result?.result?.value ?? res?.result?.value;
  };

  await send("Page.enable");
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });

  const shot = async (name) => {
    const res = await send("Page.captureScreenshot", { format: "png" });
    const data = res?.result?.data ?? res?.data;
    if (!data) throw new Error(`no screenshot data for ${name}: ${JSON.stringify(res).slice(0, 200)}`);
    writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, "base64"));
    console.log("saved", name);
  };

  const load = async (url) => { await send("Page.navigate", { url }); await new Promise((r) => setTimeout(r, 2600)); };

  // ---- home at 1280 ----
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await load(REF_INDEX);
  console.log("ref home dir:", await ev(`document.documentElement.dir + " " + document.documentElement.lang`), "scrollW:", await ev(`document.documentElement.scrollWidth`));
  await shot("ref-home-1280");
  await load(`${ORIGIN}/?lang=fa`);
  console.log("cur home dir:", await ev(`document.documentElement.dir + " " + document.documentElement.lang`), "scrollW:", await ev(`document.documentElement.scrollWidth`));
  await shot("cur-home-1280");

  // ---- home at 393 ----
  await send("Emulation.setDeviceMetricsOverride", { width: 393, height: 852, deviceScaleFactor: 1, mobile: false });
  await load(REF_INDEX);
  console.log("ref home @393 scrollW:", await ev(`document.documentElement.scrollWidth`), "innerW:", await ev(`innerWidth`));
  await shot("ref-home-393");
  await load(`${ORIGIN}/?lang=fa`);
  console.log("cur home @393 scrollW:", await ev(`document.documentElement.scrollWidth`), "innerW:", await ev(`innerWidth`));
  await shot("cur-home-393");

  // ---- services gen at 1280 ----
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await load(REF_SERVICES);
  // Select the gen chip in BOTH tablists (surgical group + medical group) the
  // way a user does: by its accessible name.
  const selected = await ev(`(() => {
    const want = "جراحی عمومی و لاپاراسکوپی";
    let hits = 0;
    for (const b of document.querySelectorAll(".scats button, .scats a")) {
      if ((b.textContent || "").trim() === want) { b.click(); hits += 1; }
    }
    return hits + "|" + (document.getElementById("sdName")?.textContent || "");
  })()`);
  console.log("ref services gen chips selected:", selected);
  await new Promise((r) => setTimeout(r, 500));
  await shot("ref-services-gen-1280");
  await load(`${ORIGIN}/services/gen?lang=fa`);
  console.log("cur services/gen breadcrumb:", await ev(`document.querySelector(".sd-crumb, .crumbs")?.textContent.trim().slice(0, 60)`));
  await shot("cur-services-gen-1280");

  // ---- services gen at 393 ----
  await send("Emulation.setDeviceMetricsOverride", { width: 393, height: 852, deviceScaleFactor: 1, mobile: false });
  await load(REF_SERVICES);
  const selected2 = await ev(`(() => {
    const want = "جراحی عمومی و لاپاراسکوپی";
    let hits = 0;
    for (const b of document.querySelectorAll(".scats button, .scats a")) {
      if ((b.textContent || "").trim() === want) { b.click(); hits += 1; }
    }
    return hits + "|" + (document.getElementById("sdName")?.textContent || "");
  })()`);
  console.log("ref services gen @393 chips selected:", selected2);
  await new Promise((r) => setTimeout(r, 500));
  console.log("ref services @393 scrollW:", await ev(`document.documentElement.scrollWidth`), "innerW:", await ev(`innerWidth`));
  await shot("ref-services-gen-393");
  await load(`${ORIGIN}/services/gen?lang=fa`);
  console.log("cur services/gen @393 scrollW:", await ev(`document.documentElement.scrollWidth`), "innerW:", await ev(`innerWidth`));
  await shot("cur-services-gen-393");

  ws.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
