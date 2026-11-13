const CDP = "http://127.0.0.1:9333";
const ORIGIN = "http://localhost:3137";

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
    if (res.exceptionDetails) return "EXC: " + (res.exceptionDetails.exception?.description?.slice(0, 400) ?? "?");
    return res?.result?.result?.value ?? res?.result?.value;
  };
  await send("Page.enable");
  await send("Page.navigate", { url: `${ORIGIN}/?lang=fa` });
  await new Promise((r) => setTimeout(r, 2600));

  const MATCH = `(() => {
    const el = document.querySelector(".nav").parentElement;
    const out = [];
    const walk = (rules, prefix) => {
      for (const r of rules) {
        const kind = r.constructor.name;
        if (kind === "CSSMediaRule") { walk(r.cssRules, prefix + "@media(" + r.conditionText + ") "); continue; }
        if (kind === "CSSLayerBlockRule") { walk(r.cssRules, prefix + "@layer(" + r.name + ") "); continue; }
        if (kind === "CSSSupportsRule" || kind === "CSSContainerRule") { walk(r.cssRules, prefix + kind + " "); continue; }
        if (kind === "CSSStyleRule") {
          let matches = false;
          try { matches = el.matches(r.selectorText); } catch {}
          if (matches && r.style.cssText.length) out.push(prefix + r.selectorText.replace(/\\s+/g," ") + " { " + r.style.cssText.slice(0, 300) + " }");
        }
      }
    };
    for (const sh of document.styleSheets) walk(sh.cssRules, "");
    return out.join("\\n") || "(no matching rules)";
  })()`;
  console.log("rules matching the .container element:\n" + await ev(MATCH));

  // do the same on the reference for comparison
  const REF = "file:///D:/New%20folder/Clinic-pro/%D9%BE%D9%84%D8%AA%D9%81%D8%B1%D9%85/index.html?lang=fa";
  await send("Page.navigate", { url: REF });
  await new Promise((r) => setTimeout(r, 2400));
  console.log("\nREFERENCE rules matching .container:\n" + await ev(MATCH));
  ws.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
