/**
 * route.test.ts — GET /api/status (P1-13).
 *
 * The Route Handler is deliberately thin (CLAUDE.md §5: "Business logic never
 * in a Route Handler"), so this test pins only its HTTP responsibilities:
 *   1. it serializes a payload that satisfies the client's Zod contract;
 *   2. it publishes a short public cache and UTF-8 JSON content type;
 *   3. it rate-limits per client IP (60 / 60 s) with a 429;
 *   4. it reads the client IP from x-forwarded-for, so clients are tracked
 *      independently (each test uses its own IP — the limiter is a module
 *      singleton shared across this file).
 *
 * The open/closed *value* is exercised against boundary clocks in
 * core/openHours.test.ts; here the clock is the real one, so the response is
 * asserted by shape, not by value.
 */

import { describe, expect, it } from "vitest";

import { statusResponseSchema } from "@/modules/services/schemas/statusSchema";
import { GET } from "./route";

/** A fresh client IP per test — the limiter is a module-level singleton. */
let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `203.0.113.${ipCounter}`;
}

function requestFor(ip: string): Request {
  return new Request("http://test.local/api/status", { headers: { "x-forwarded-for": ip } });
}

function bodyOf(response: Response) {
  return response.json();
}

describe("GET /api/status", () => {
  it("returns 200 with a payload that satisfies the client contract", async () => {
    const response = await GET(requestFor(nextIp()));
    expect(response.status).toBe(200);
    const payload = await bodyOf(response);
    expect(statusResponseSchema.safeParse(payload).success).toBe(true);
  });

  it("answers in the open shape while the clinic is open", async () => {
    const response = await GET(requestFor(nextIp()));
    const payload = await bodyOf(response);
    if (payload.open === true) {
      expect(payload.closeMinutes).toBeGreaterThanOrEqual(1);
      expect(payload.closeMinutes).toBeLessThanOrEqual(750);
    } else {
      expect(payload.opensInMinutes).toBeGreaterThanOrEqual(1);
      expect(payload.opensInMinutes).toBeLessThanOrEqual(6000);
      expect(["today", "tomorrow", "saturday"]).toContain(payload.dayLabel);
    }
  });

  it("publishes a short public cache and UTF-8 JSON", async () => {
    const response = await GET(requestFor(nextIp()));
    const cacheControl = response.headers.get("Cache-Control");
    expect(cacheControl).toContain("public");
    expect(cacheControl).toContain("max-age=30");
    expect(cacheControl).toContain("s-maxage=30");
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(response.headers.get("Content-Type")).toContain("charset=utf-8");
  });

  it("allows 60 requests per minute per client IP, then 429s", async () => {
    const ip = nextIp();
    for (let i = 0; i < 60; i += 1) {
      const response = await GET(requestFor(ip));
      expect(response.status).toBe(200);
    }
    const over = await GET(requestFor(ip));
    expect(over.status).toBe(429);
    const overBody = await bodyOf(over);
    expect(overBody).toMatchObject({ error: expect.stringContaining("Too Many Requests") });
  });

  it("rate-limits clients independently (one abuser starves no one)", async () => {
    const abuser = nextIp();
    const others = nextIp();
    for (let i = 0; i < 60; i += 1) await GET(requestFor(abuser));
    expect((await GET(requestFor(abuser))).status).toBe(429);
    expect((await GET(requestFor(others))).status).toBe(200);
  });

  it("falls back to an 'unknown' key when x-forwarded-for is absent", async () => {
    // No header at all — must still respond (not crash) with a valid payload.
    const response = await GET(new Request("http://test.local/api/status"));
    expect(response.status).toBe(200);
    expect(statusResponseSchema.safeParse(await bodyOf(response)).success).toBe(true);
  });
});
