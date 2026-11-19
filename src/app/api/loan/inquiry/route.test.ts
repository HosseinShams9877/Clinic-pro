/**
 * route.test.ts — POST /api/loan/inquiry.
 *
 * The handler is thin by design (CLAUDE.md §5), so this pins only its
 * HTTP responsibilities: Zod rejection with 400, the rate limit with
 * 429, mapping the service's JetPayError to the error envelope, and the
 * success payload. The bank and the database are stubbed.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { JetPayError } from "@/modules/loan/services/jetpay";
import { POST } from "./route";

const { serviceStub } = vi.hoisted(() => ({ serviceStub: {} as Record<string, unknown> }));
vi.mock("@/modules/loan/services/loanService", () => ({
  getLoanService: () => serviceStub,
}));

let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `203.0.113.${ipCounter}`;
}
function requestFor(ip: string, body: unknown): Request {
  return new Request("http://test.local/api/loan/inquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  serviceStub.inquire = vi.fn(async () => ({
    requestId: "CR-0016-1761109080025-e6f8fb",
    credits: [{ creditId: "156-2379-2287", creditName: "سپاس", creditBalance: 100_000_000 }],
  }));
});

describe("POST /api/loan/inquiry", () => {
  it("returns 200 with the credits and the bank requestId", async () => {
    const response = await POST(requestFor(nextIp(), { nationalCode: "4533654504" }));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.requestId).toBe("CR-0016-1761109080025-e6f8fb");
    expect(payload.credits[0]).toMatchObject({ creditId: "156-2379-2287", creditBalance: 100_000_000 });
    expect(serviceStub.inquire).toHaveBeenCalledWith("4533654504");
  });

  it("normalizes Persian digits before validation (the reference's own en() rule)", async () => {
    const response = await POST(requestFor(nextIp(), { nationalCode: "۴۵۳۳۶۵۴۵۰۴" }));
    expect(response.status).toBe(200);
    expect(serviceStub.inquire).toHaveBeenCalledWith("4533654504");
  });

  it("returns 400 for a malformed national code and never calls the service", async () => {
    const response = await POST(requestFor(nextIp(), { nationalCode: "123" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: expect.stringContaining("national code") });
    expect(serviceStub.inquire).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is not JSON at all", async () => {
    const response = await POST(
      new Request("http://test.local/api/loan/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": nextIp() },
      }),
    );
    expect(response.status).toBe(400);
  });

  it("maps a JetPayError to the error envelope with the bank's message and code", async () => {
    serviceStub.inquire = vi.fn(async () => {
      throw new JetPayError(55500020, "اعتباری برای مصرف یافت نشد", "can not find credit for customer");
    });
    const response = await POST(requestFor(nextIp(), { nationalCode: "4533654504" }));
    expect(response.status).toBe(502);
    const payload = await response.json();
    expect(payload).toMatchObject({ code: 55500020, fa: "اعتباری برای مصرف یافت نشد" });
  });

  it("returns 503 when the bank is unreachable (JetPayError code 0)", async () => {
    serviceStub.inquire = vi.fn(async () => {
      throw new JetPayError(0, "ارتباط ممکن نیست", "unreachable");
    });
    const response = await POST(requestFor(nextIp(), { nationalCode: "4533654504" }));
    expect(response.status).toBe(503);
  });

  it("allows 10 requests per minute per client IP, then 429s", async () => {
    const ip = nextIp();
    for (let i = 0; i < 10; i += 1) {
      expect((await POST(requestFor(ip, { nationalCode: "4533654504" }))).status).toBe(200);
    }
    const over = await POST(requestFor(ip, { nationalCode: "4533654504" }));
    expect(over.status).toBe(429);
    expect(await over.json()).toMatchObject({ error: expect.stringContaining("Too Many") });
  });

  it("rate-limits clients independently", async () => {
    const abuser = nextIp();
    const other = nextIp();
    for (let i = 0; i < 10; i += 1) await POST(requestFor(abuser, { nationalCode: "4533654504" }));
    expect((await POST(requestFor(abuser, { nationalCode: "4533654504" }))).status).toBe(429);
    expect((await POST(requestFor(other, { nationalCode: "4533654504" }))).status).toBe(200);
  });
});
