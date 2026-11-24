import { access } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /assistant", () => {
  it("serves the new reference Smart Guide DOM and search/result hooks", async () => {
    const response = await GET();
    const html = await response.text();
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain('class="ast"');
    expect(html).toContain('id="aq"');
    expect(html).toContain('id="aRes"');
    expect(html).toContain('id="fList"');
    expect(html).not.toMatch(/doctor-panel|staff-panel|finance-panel|platform\.html/);
  });

  it("ships every local stylesheet and script used by the standalone demo", async () => {
    for (const relative of [
      "assets/css/style.css",
      "assets/css/assistant.css",
      "assets/js/assistant-data.js",
      "assets/js/assistant.js",
      "assets/js/main.js",
    ]) {
      await expect(access(path.join(process.cwd(), "public", "reference", "assistant", relative))).resolves.toBeUndefined();
    }
  });
});
