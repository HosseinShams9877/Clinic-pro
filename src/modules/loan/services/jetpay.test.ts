/**
 * jetpay.test.ts — the JetPay bank client, tested against a stubbed
 * transport (injectable `fetch`) — no network, no credentials.
 *
 * What is pinned: the PDF's contract. Method, path, headers, body and
 * the parse of each documented response (§1-4 … §1-14), the error
 * envelope, the 401 single-retry, the timeout, and the token's JWT-exp
 * caching. What is deliberately NOT pinned: how the client is wired
 * into routes (that is the route tests' job).
 */

import { describe, expect, it, vi } from "vitest";

import { JetPayClient, JetPayError, tokenExpiryMs } from "./jetpay";

/** A config with no secrets — the client only forwards it to the stub. */
const CONFIG = {
  baseUrl: "https://bank.test.local",
  username: "merchant",
  password: "secret",
  terminalId: "term-1",
} as const;

/** A stubbed fetch — kept as a vitest Mock so tests can inspect calls. */
type FetchStub = ReturnType<typeof vi.fn>;

/** The single place a stub meets the client's `typeof fetch` parameter. */
function clientOf(fetchStub: FetchStub): JetPayClient {
  return new JetPayClient(CONFIG, fetchStub as unknown as typeof fetch);
}

/** JWT payload encoder for the token cache tests (header.payload.sig). */
function jwt(expSeconds: number): string {
  const payload = JSON.stringify({ exp: expSeconds });
  return `hdr.${Buffer.from(payload).toString("base64").replace(/=+$/, "")}.sig`;
}

/** Build a stub fetch returning the given JSON body. */
function fetchOk(body: unknown): FetchStub {
  return vi.fn(async () => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
}

function fetchStatus(status: number, body: unknown): FetchStub {
  return vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
}

/** Wrap an endpoint stub so /token is answered with the given token. */
function withToken(fetchStub: FetchStub, token: string): FetchStub {
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/token")) {
      return new Response(JSON.stringify({ status: 200, success: true, result: { token } }), { status: 200 });
    }
    return (fetchStub as (url: string, init?: RequestInit) => Promise<Response>)(url, init);
  });
}

/** The PDF §1-5 sample response, trimmed to the documented fields. */
const ACCOUNT_BALANCE = {
  status: 200,
  success: true,
  result: {
    requestId: "CR-0016-1761109080025-e6f8fb",
    credits: [
      {
        credit_balance: 599923640,
        credit_info: {
          credit_id: "344-758538-39836",
          credit_name: "سپاس",
          description: "(کالانو) سپاس",
          start_date: "2025-10-08T10:37:22.1824561",
          end_date: "2026-10-08T10:37:22.1824561",
          credit_amount: 599977000,
        },
        customer_detail: {
          first_name: "حسن",
          last_name: "قاسمی",
          account_number: "1-0002-00987068-01",
        },
      },
    ],
  },
};

describe("JetPayClient.token", () => {
  it("posts {username, password, terminalId} to /token with JSON content type and no bearer", async () => {
    const fetchStub = fetchOk({ status: 200, success: true, result: { token: jwt(Date.now() / 1000 + 3600) } });
    const client = clientOf(fetchStub);
    await client.token();
    const [url, init] = fetchStub.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://bank.test.local/api/v1/credit-consumption/token");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
    expect(JSON.parse(init.body as string)).toEqual({
      username: "merchant",
      password: "secret",
      terminalId: "term-1",
    });
  });

  it("caches the token while it stays valid, re-auths after invalidation", async () => {
    const valid = jwt(Date.now() / 1000 + 3600);
    const fetchStub = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      return new Response(
        JSON.stringify({ status: 200, success: true, result: { token: body.username === "merchant" ? valid : valid } }),
        { status: 200 },
      );
    });
    const client = clientOf(fetchStub);

    await client.token();
    await client.token();
    expect(fetchStub).toHaveBeenCalledTimes(1); // still valid — cached

    client.invalidateToken();
    await client.token();
    expect(fetchStub).toHaveBeenCalledTimes(2); // forced refresh
  });

  it("rejects a success:false envelope as a typed JetPayError with the bank's code and messages", async () => {
    const fetchStub = fetchStatus(400, {
      status: 400,
      success: false,
      result: { error: { fa: "ایجاد توکن با مشکل روبرو شد", en: "Create token failed", code: 700003 } },
    });
    const client = clientOf(fetchStub);
    await expect(client.token()).rejects.toMatchObject({
      name: "JetPayError",
      code: 700003,
      fa: "ایجاد توکن با مشکل روبرو شد",
      en: "Create token failed",
    });
  });

  it("tolerates a missing error object (generic message, 400 status)", async () => {
    const fetchStub = fetchStatus(400, { status: 400, success: false, result: {} });
    const client = clientOf(fetchStub);
    await expect(client.token()).rejects.toBeInstanceOf(JetPayError);
  });
});

describe("JetPayClient endpoints", () => {
  const token = jwt(Date.now() / 1000 + 3600);

  it("accountBalance: GET with nationalCode query and Bearer header, parses the documented shape", async () => {
    const inner = fetchOk(ACCOUNT_BALANCE);
    const stub = withToken(inner, token);
    stub.mock.calls; // type placeholder
    const client = clientOf(stub);
    const result = await client.accountBalance("4533654504");
    const [url, init] = inner.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/credit-consumption/account-balance?nationalCode=4533654504");
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${token}`);
    expect(result.requestId).toBe("CR-0016-1761109080025-e6f8fb");
    expect(result.credits[0]!.credit_balance).toBe(599923640);
    expect(result.credits[0]!.credit_info.credit_id).toBe("344-758538-39836");
  });

  it("sendOtp: POSTs the documented body (§1-6) and returns the masked mobile", async () => {
    const inner = fetchOk({ status: 200, success: true, result: { mobile: "091******93" } });
    const client = clientOf(withToken(inner, token));
    const result = await client.sendOtp({ nationalCode: "4550284250", requestId: "CR-4560-1759143340183-da8570", creditId: "156-2379-2222", amount: 10000 });
    const [url, init] = inner.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/credit-consumption/send-otp");
    expect(JSON.parse(init.body as string)).toEqual({
      nationalCode: "4550284250",
      requestId: "CR-4560-1759143340183-da8570",
      creditId: "156-2379-2222",
      amount: 10000,
    });
    expect(result.mobile).toBe("091******93");
  });

  it("purchase: POSTs the documented body (§1-8) with the otp and parses transaction/reference", async () => {
    const inner = fetchOk({
      status: 200,
      success: true,
      result: { transactionId: 748, referenceNumber: "1175914726766597", status: "PENDING", creditInfo: { creditId: "156-2379-2287", creditName: "الان بخر، بعدا پرداخت کن!", usedAmount: 10000 } },
    });
    const client = clientOf(withToken(inner, token));
    const result = await client.purchase({ nationalCode: "4544484504", amount: 10000, requestId: "CR-4560-1759143340183-da8570", creditId: "156-2379-2287", otp: "52320" });
    const [url, init] = inner.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/credit-consumption/purchase");
    expect(JSON.parse(init.body as string)).toEqual({ nationalCode: "4544484504", amount: 10000, requestId: "CR-4560-1759143340183-da8570", creditId: "156-2379-2287", otp: "52320" });
    expect(result).toMatchObject({ transactionId: 748, referenceNumber: "1175914726766597", status: "PENDING" });
  });

  it("confirm: POSTs {referenceNumber} only (§1-9)", async () => {
    const inner = fetchOk({ status: 200, success: true, result: { transactionId: 749, referenceNumber: "1175914726766597", status: "CONFIRMED", creditInfo: { creditId: "156-2379-2287", creditName: "x", confirmedAmount: "10000.00" } } });
    const client = clientOf(withToken(inner, token));
    const result = await client.confirm("1175914726766597");
    const [url, init] = inner.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/credit-consumption/confirm");
    expect(JSON.parse(init.body as string)).toEqual({ referenceNumber: "1175914726766597" });
    expect(result.status).toBe("CONFIRMED");
  });

  it("inquiry: GETs with the query param and parses the nested step list (§1-13)", async () => {
    const inner = fetchOk({
      status: 200,
      success: true,
      result: [[{ step: "PURCHASE", status: "COMPLETED", date: "2025-10-19T14:04:43.988Z", amount: "30000.00" }, { step: "CONFIRM", status: "CONFIRMED", date: "2025-10-19T14:04:46.876Z", amount: "30000.00", clarifiedStatus: "ADVICE" }]],
    });
    const client = clientOf(withToken(inner, token));
    const result = await client.inquiry("1175914726766597");
    expect(inner.mock.calls[0]![0] as string).toContain("/api/v1/credit-consumption/inquiry?referenceNumber=1175914726766597");
    expect(result[0]![0]!).toMatchObject({ step: "PURCHASE", status: "COMPLETED" });
    expect(result[0]![1]!).toMatchObject({ step: "CONFIRM", status: "CONFIRMED" });
  });

  it("transactionList: sends page/size/dates as query params (§1-14) and returns list+total", async () => {
    const inner = fetchOk({ status: 200, success: true, result: { list: [{ nationalCode: "0123456789", requestId: "12345", status: "تایید شده", totalAmount: 3000000000, creditType: "KALANO", referenceNumber: "11780153176" }], total: 500 } });
    const client = clientOf(withToken(inner, token));
    const result = await client.transactionList({ nationalCode: "0123456789", fromDate: "2026-05-15", toDate: "2026-05-30", page: 1, size: 10 });
    const url = inner.mock.calls[0]![0] as string;
    expect(url).toContain("/api/v1/credit-consumption/transaction-list?");
    expect(url).toContain("nationalCode=0123456789");
    expect(url).toContain("fromDate=2026-05-15");
    expect(url).toContain("toDate=2026-05-30");
    expect(url).toContain("page=1");
    expect(url).toContain("size=10");
    expect(result.total).toBe(500);
    expect(result.list[0]!).toMatchObject({ referenceNumber: "11780153176" });
  });
});

describe("JetPayClient transport resilience", () => {
  it("re-auths once on a 401, then succeeds", async () => {
    const calls: string[] = [];
    const fetchStub = vi.fn(async (url: string) => {
      calls.push(url);
      if (url.endsWith("/token")) return new Response(JSON.stringify({ status: 200, success: true, result: { token: jwt(Date.now() / 1000 + 3600) } }), { status: 200 });
      if (calls.filter((call) => call.endsWith("/token")).length === 1) {
        return new Response(JSON.stringify({ status: 401, success: false, result: { error: { en: "Authorization failed", code: 1100006 } } }), { status: 401 });
      }
      return new Response(JSON.stringify({ status: 200, success: true, result: [[{ step: "PURCHASE", status: "PENDING" }]] }), { status: 200 });
    });
    const client = clientOf(fetchStub);
    const result = await client.inquiry("1175914726766597");
    expect(result[0]![0]!.status).toBe("PENDING");
    expect(calls.filter((call) => call.endsWith("/token"))).toHaveLength(2); // cached, then re-auth
  });

  it("surfaces a network failure as JetPayError code 0 (unreachable)", async () => {
    const fetchStub = vi.fn(async () => {
      throw new Error("EAI_AGAIN");
    });
    const client = clientOf(fetchStub);
    await expect(client.accountBalance("4533654504")).rejects.toMatchObject({ code: 0, name: "JetPayError" });
  });

  it("surfaces a timeout (abort) as unreachable, not as a hang", async () => {
    // The bank call aborts (the AbortSignal.timeout path). Rejected with
    // an AbortError-shaped error at once — the point is the mapping, not
    // the 15 s wall clock.
    const fetchStub = vi.fn(async () => {
      throw Object.assign(new Error("The operation was aborted"), { name: "AbortError" });
    });
    const client = clientOf(fetchStub);
    await expect(client.accountBalance("4533654504")).rejects.toMatchObject({ code: 0 });
  });

  it("does not retry forever: a second 401 still throws the bank error", async () => {
    const fetchStub = vi.fn(async (url: string) => {
      if (url.endsWith("/token")) return new Response(JSON.stringify({ status: 200, success: true, result: { token: jwt(Date.now() / 1000 + 3600) } }), { status: 200 });
      return new Response(JSON.stringify({ status: 401, success: false, result: { error: { en: "Authorization failed", code: 1100006 } } }), { status: 401 });
    });
    const client = clientOf(fetchStub);
    await expect(client.inquiry("1175914726766597")).rejects.toMatchObject({ code: 1100006 });
  });

  it("rejects a non-JSON body as a JetPayError instead of throwing a raw TypeError", async () => {
    const fetchStub = vi.fn(async () => new Response("<html>gateway error</html>", { status: 502, headers: { "Content-Type": "text/html" } }));
    const client = clientOf(fetchStub);
    await expect(client.accountBalance("4533654504")).rejects.toBeInstanceOf(JetPayError);
  });
});

describe("tokenExpiryMs", () => {
  it("decodes a real JWT exp (seconds → ms)", () => {
    expect(tokenExpiryMs(jwt(1731595565))).toBe(1731595565000);
  });

  it("falls back to 0 (treated as expired) for malformed tokens", () => {
    expect(tokenExpiryMs("not-a-jwt")).toBe(0);
    expect(tokenExpiryMs("a.b")).toBe(0);
    expect(tokenExpiryMs(jwtPayloadWithoutExp())).toBe(0);
  });
});

function jwtPayloadWithoutExp(): string {
  return `hdr.${Buffer.from(JSON.stringify({ sub: "x" })).toString("base64").replace(/=+$/, "")}.sig`;
}
