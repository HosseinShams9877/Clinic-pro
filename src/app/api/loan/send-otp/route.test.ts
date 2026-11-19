/**
 * route.test.ts — POST /api/loan/send-otp.
 *
 * The tightest rate limit of the flow (an OTP costs the merchant an
 * SMS): 5 / minute per IP. Pinned here along with the Zod edge.
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
  return new Request("http://test.local/api/loan/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

const VALID = {
  nationalCode: "4550284250",
  requestId: "CR-4560-1759143340183-da8570",
  creditId: "156-2379-2222",
  amount: 10000,
};

beforeEach(() => {
  serviceStub.sendOtp = vi.fn(async () => ({ mobile: "091******93" }));
});

describe("POST /api/loan/send-otp", () => {
  it("returns 200 with the masked mobile for a valid request", async () => {
    const response = await POST(requestFor(nextIp(), VALID));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ mobile: "091******93" });
    expect(serviceStub.sendOtp).toHaveBeenCalledWith(VALID);
  });

  it("returns 400 when a documented field is missing or invalid", async () => {
    for (const body of [
      { ...VALID, amount: 0 },
      { ...VALID, amount: 1.5 },
      { ...VALID, creditId: "" },
      { ...VALID, requestId: "x" },
      { nationalCode: "4550284250" },
      {},
    ]) {
      const response = await POST(requestFor(nextIp(), body));
      expect(response.status).toBe(400);
    }
    expect(serviceStub.sendOtp).not.toHaveBeenCalled();
  });

  it("returns 502 with the bank's own message when the bank refuses (e.g. resend too soon)", async () => {
    serviceStub.sendOtp = vi.fn(async () => {
      throw new JetPayError(500004, "برای ارسال مجدد کد چند دقیقه دیگر تلاش نمایید", "wait a few minutes");
    });
    const response = await POST(requestFor(nextIp(), VALID));
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ code: 500004 });
  });

  it("allows 5 requests per minute per client IP, then 429s", async () => {
    const ip = nextIp();
    for (let i = 0; i < 5; i += 1) {
      expect((await POST(requestFor(ip, VALID))).status).toBe(200);
    }
    expect((await POST(requestFor(ip, VALID))).status).toBe(429);
  });
});
