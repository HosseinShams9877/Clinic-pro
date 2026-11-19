/**
 * loanIntegration.test.ts — the full loan stack against a REAL HTTP
 * server, not a stubbed fetch.
 *
 * Runs in vitest's NODE environment (the per-file pragma below): the
 * test exercises the real fetch transport, whose timeout signal must
 * be Node's own AbortSignal — jsdom's fails undici's instance check
 * (the same reason this is the only loan test that needs no DOM).
 *
 * A local node:http server implements the JetPay endpoints exactly as
 * the official PDF specifies (its sample request/response shapes), and
 * the real JetPayClient + LoanService + Prisma run against it. This is
 * the closest verification of the production chain short of the sandbox
 * itself, which is unreachable from this build machine (see
 * LOAN_FEATURE_REPORT.md §"Sandbox verification").
 *
 * What only this test can catch: the real fetch transport (headers,
 * JSON bodies, timeouts), the token round trip through actual HTTP, and
 * the wiring of the whole sequence with persistence at every step.
 */

// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";

import { LOAN_STATUS } from "../constants";
import { JetPayClient } from "./jetpay";
import { LoanService } from "./loanService";
import { prisma } from "./prisma";

/** The recorded bank-side view of every request the client made. */
const wireLog: Array<{ method: string; url: string; authorization?: string; body?: unknown }> = [];

/** A JWT the test bank hands out (exp 1 h from issuance). */
function fakeJwt(): string {
  const payload = JSON.stringify({ exp: Math.floor((Date.now() + 3_600_000) / 1000) });
  return `hdr.${Buffer.from(payload).toString("base64").replace(/=+$/, "")}.sig`;
}

let server: Server;
let baseUrl: string;

beforeEach(async () => {
  wireLog.length = 0;
  server = createServer((req, res) => {
    let chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf-8")) : undefined;
      wireLog.push({
        method: req.method ?? "GET",
        url: req.url ?? "/",
        authorization: req.headers.authorization,
        body,
      });

      const respond = (status: number, json: unknown) => {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(json));
      };

      // §1-4 token — the only call without a Bearer.
      if (req.url === "/api/v1/credit-consumption/token") {
        expect(body).toMatchObject({ username: "merchant", password: "secret", terminalId: "term-1" });
        return respond(200, { status: 200, success: true, result: { token: fakeJwt() } });
      }
      // §1-5 credit inquiry.
      if (req.url?.startsWith("/api/v1/credit-consumption/account-balance")) {
        return respond(200, {
          status: 200,
          success: true,
          result: {
            requestId: "CR-0099-1761109080099-integ",
            credits: [
              {
                credit_balance: 100_000_000,
                credit_info: { credit_id: "156-2379-2287", credit_name: "سپاس", credit_amount: 120_000_000 },
                customer_detail: { first_name: "حسن", last_name: "قاسمی" },
              },
            ],
          },
        });
      }
      // §1-6 send OTP.
      if (req.url === "/api/v1/credit-consumption/send-otp") {
        return respond(200, { status: 200, success: true, result: { mobile: "091******93" } });
      }
      // §1-8 purchase (OTP verification).
      if (req.url === "/api/v1/credit-consumption/purchase") {
        return respond(200, {
          status: 200,
          success: true,
          result: {
            transactionId: 748,
            referenceNumber: "1175914726766597",
            status: "PENDING",
            creditInfo: { creditId: "156-2379-2287", usedAmount: 25_000_000 },
          },
        });
      }
      // §1-13 status: first poll PENDING, then COMPLETED.
      if (req.url?.startsWith("/api/v1/credit-consumption/inquiry")) {
        const purchaseCalls = wireLog.filter((entry) => entry.url?.startsWith("/api/v1/credit-consumption/inquiry")).length;
        return respond(200, {
          status: 200,
          success: true,
          result:
            purchaseCalls <= 1
              ? [[{ step: "PURCHASE", status: "PENDING" }]]
              : [[{ step: "PURCHASE", status: "COMPLETED", amount: "25000000.00" }]],
        });
      }
      // §1-9 confirm.
      if (req.url === "/api/v1/credit-consumption/confirm") {
        return respond(200, {
          status: 200,
          success: true,
          result: {
            transactionId: 749,
            referenceNumber: "1175914726766597",
            status: "CONFIRMED",
            creditInfo: { creditId: "156-2379-2287", confirmedAmount: "25000000.00" },
          },
        });
      }
      return respond(404, { status: 404, success: false, result: { error: { en: "unknown route" } } });
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;

  await prisma.transaction.deleteMany();
  await prisma.loanRequest.deleteMany();
});

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("the full loan flow over real HTTP", () => {
  it("runs inquiry → send-otp → verify → status → confirm, persisting every step", async () => {
    const client = new JetPayClient({
      baseUrl,
      username: "merchant",
      password: "secret",
      terminalId: "term-1",
    });
    const service = new LoanService(client);

    // 1. Inquiry.
    const inquiry = await service.inquire("4533654504");
    expect(inquiry.credits[0]!.creditBalance).toBe(100_000_000);

    // 2. Amount + OTP.
    const otp = await service.sendOtp({
      nationalCode: "4533654504",
      requestId: "CR-0099-1761109080099-integ",
      creditId: "156-2379-2287",
      amount: 25_000_000,
    });
    expect(otp).toEqual({ mobile: "091******93" });

    // 3. OTP verification (purchase).
    const purchase = await service.verify({
      nationalCode: "4533654504",
      requestId: "CR-0099-1761109080099-integ",
      creditId: "156-2379-2287",
      amount: 25_000_000,
      otp: "12345",
    });
    expect(purchase.referenceNumber).toBe("1175914726766597");

    // 4. Status polling: first PENDING, then COMPLETED after the bank
    //    progresses the transaction.
    const pending = await service.status("1175914726766597");
    expect(pending.loanStatus).toBe(LOAN_STATUS.purchased);
    const completed = await service.status("1175914726766597");
    expect(completed.steps[0]).toMatchObject({ status: "COMPLETED" });

    // 5. Confirm — the money is committed.
    const confirmed = await service.confirm("1175914726766597");
    expect(confirmed.status).toBe("CONFIRMED");

    // The persisted journey tells the whole story from our own rows.
    const loan = await prisma.loanRequest.findFirstOrThrow();
    expect(loan.status).toBe(LOAN_STATUS.confirmed);
    expect(loan.referenceNumber).toBe("1175914726766597");
    expect(loan.amount).toBe(25_000_000n);
    const steps = await prisma.transaction.findMany({ orderBy: { step: "asc" } });
    expect(steps.map((step) => [step.step, step.status])).toEqual([
      ["CONFIRM", "CONFIRMED"],
      ["PURCHASE", "PENDING"],
      ["PURCHASE", "COMPLETED"],
    ]);

    // The wire log is the contract: one token fetch (cached), Bearer on
    // every later call, and the purchase body exactly as documented.
    expect(wireLog.filter((entry) => entry.url.endsWith("/token"))).toHaveLength(1);
    for (const entry of wireLog) {
      if (!entry.url.endsWith("/token")) {
        expect(entry.authorization).toMatch(/^Bearer .+\..+\..+$/);
      } else {
        expect(entry.authorization).toBeUndefined();
      }
    }
    const purchaseWire = wireLog.find((entry) => entry.url.endsWith("/purchase"));
    expect(purchaseWire?.body).toEqual({
      nationalCode: "4533654504",
      amount: 25_000_000,
      requestId: "CR-0099-1761109080099-integ",
      creditId: "156-2379-2287",
      otp: "12345",
    });
  });
});
