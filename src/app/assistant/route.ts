import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

/**
 * The Smart Guide is the new reference's self-contained public demo. Serving
 * its generated HTML directly preserves its DOM, CSS and vanilla-JS behavior
 * byte-for-byte while keeping the source reference tree read-only.
 */
export async function GET() {
  const file = path.join(process.cwd(), "public", "reference", "assistant", "index.html");
  const html = await readFile(file, "utf8");

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
