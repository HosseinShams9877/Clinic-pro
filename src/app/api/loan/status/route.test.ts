/**
 * route.test.ts — GET /api/loan/status?referenceNumber=… (JetPay §1-13).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { JetPayError } from "@/modules/loan/services/jetpay";
import { GET } from "./route";

const { serviceStub } = vi.hoisted(() => ({ serviceStub: {} as Record<string, unknown> }));
vi.mock("@/modules/loan/services/loanService", () => ({
  getLoanService: () => serviceStub,
}));

let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `203.0.113.${ipCounter}`;
}
function requestFor(ip: string, query: string): Request {
  return new Request(`http://test.local/api/loan/status?${query}`, {
    headers: { "x-forwarded-for": ip },
  });
}

beforeEach(() => {
  serviceStub.status = vi.fn(async () => ({
    steps: [{ step: "PURCHASE", status: "PENDING", date: "2025-10-19T14:04:43.988Z" }],
    loanStatus: "PURCHASED",
  }));
});

describe("GET /api/loan/status", () => {
  it("returns 200 with the flat step list and our loan status", async () => {
    const response = await GET(requestFor(nextIp(), "referenceNumber=1175914726766597"));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.steps[0]).toMatchObject({ step: "PURCHASE", status: "PENDING" });
    expect(payload.loanStatus).toBe("PURCHASED");
    expect(serviceStub.status).toHaveBeenCalledWith("1175914726766597");
  });

  it("URL-decodes the reference number", async () => {
    const response = await GET(requestFor(nextIp(), "referenceNumber=1175914726766597%2F1"));
    expect(response.status).toBe(200);
    expect(serviceStub.status).toHaveBeenCalledWith("1175914726766597/1");
  });

  it("returns 400 when the reference number is missing or too short", async () => {
    expect((await GET(requestFor(nextIp(), ""))).status).toBe(400);
    expect((await GET(requestFor(nextIp(), "referenceNumber=ab"))).status).toBe(400);
    expect(serviceStub.status).not.toHaveBeenCalled();
  });

  it("maps a JetPayError (order not found) to 502 with the bank code", async () => {
    serviceStub.status = vi.fn(async () => {
      throw new JetPayError(700003, "سفارش مورد نظر یافت نشد", "order not found");
    });
    const response = await GET(requestFor(nextIp(), "referenceNumber=1175914726766597"));
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ code: 700003 });
  });

  it("allows 30 requests per minute per client IP (the wizard's poll cadence), then 429s", async () => {
    const ip = nextIp();
    for (let i = 0; i < 30; i += 1) {
      expect((await GET(requestFor(ip, "referenceNumber=1175914726766597"))).status).toBe(200);
    }
    expect((await GET(requestFor(ip, "referenceNumber=1175914726766597"))).status).toBe(429);
  });
});
