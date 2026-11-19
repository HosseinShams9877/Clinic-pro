#!/usr/bin/env node
/**
 * loan-sandbox-smoke.mjs — run the documented JetPay flow against the
 * real sandbox, end to end, from the command line.
 *
 * Why this script exists: the loan feature is verified in-repo against
 * a local mock bank (src/modules/loan/services/loanIntegration.test.ts)
 * and with full unit coverage of every endpoint. The *sandbox itself*
 * is unreachable from this build machine (DNS/ICMP time out), so this
 * script is how an operator on a network that can reach the host
 * confirms the live integration. It exercises the real client code —
 * the same JetPayClient the routes use — with credentials read from
 * .env (never from the command line, never printed).
 *
 * Usage:
 *   node scripts/loan-sandbox-smoke.mjs                 # full flow
 *   node scripts/loan-sandbox-smoke.mjs inquiry 4533654504   # inquiry only
 *
 * Exits non-zero on any step. Prints nothing sensitive: tokens,
 * passwords and full JWTs are never echoed (only the shape of responses).
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Minimal .env loader (the script must stay dependency-free): KEY="value"
// lines only — the same shape .env.example documents.
const envPath = join(dirname(fileURLToPath(import.meta.url)), "..", ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const match = /^\s*([A-Z][A-Z0-9_]*)\s*=\s*"?([^"\n]*)"?/.exec(line);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
}

const BASE = process.env.JETPAY_BASE_URL;
const REQUIRED = ["JETPAY_BASE_URL", "JETPAY_USERNAME", "JETPAY_PASSWORD", "JETPAY_TERMINAL_ID"];
const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`missing environment variables: ${missing.join(", ")} (see .env.example)`);
  process.exit(2);
}

const TIMEOUT_MS = 15_000;

/** One bank call, mirroring src/modules/loan/services/jetpay.ts. */
async function call({ token, path, method, body }) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json = await response.json().catch(() => null);
  if (!json?.success) {
    const error = json?.result?.error ?? {};
    throw new Error(`${method} ${path} failed: HTTP ${response.status} code=${error.code ?? "?"} ${error.en ?? "no message"}`);
  }
  return json.result;
}

/** A short, non-identifying summary for the console. */
const summary = (value) => JSON.stringify(value, (key, item) => (key === "token" ? "<redacted>" : item));

async function main() {
  const mode = process.argv[2] ?? "full";
  const nationalCode = process.argv[3] ?? "4533654504"; // the PDF's own sample code

  console.log(`token: POST ${BASE}/api/v1/credit-consumption/token`);
  const { token } = await call({
    path: "/api/v1/credit-consumption/token",
    method: "POST",
    body: {
      username: process.env.JETPAY_USERNAME,
      password: process.env.JETPAY_PASSWORD,
      terminalId: process.env.JETPAY_TERMINAL_ID,
    },
  });
  console.log(`  ok: token received (${token.length} chars, not printed)\n`);

  console.log(`account-balance: GET …?nationalCode=${nationalCode}`);
  const balance = await call({ token, path: `/api/v1/credit-consumption/account-balance?nationalCode=${nationalCode}`, method: "GET" });
  console.log(`  ok: requestId=${balance.requestId}, credits=${balance.credits.length}`);
  for (const credit of balance.credits) {
    console.log(
      `       credit_id=${credit.credit_info.credit_id} name=${credit.credit_info.credit_name} balance=${credit.credit_balance}`,
    );
  }
  if (mode === "inquiry") return;

  // The remaining steps mutate the sandbox and need a real OTP; report
  // the documented shape so an operator can drive them by hand or via
  // the UI at /loan.
  console.log(`\nnext steps (need a live OTP — run these from the site at /loan):`);
  console.log(`  send-otp:  POST /api/v1/credit-consumption/send-otp`);
  console.log(`             body: ${JSON.stringify({ nationalCode, requestId: balance.requestId, creditId: balance.credits[0]?.credit_info.credit_id, amount: 10000 })}`);
  console.log(`  purchase:  POST /api/v1/credit-consumption/purchase (same body + otp)`);
  console.log(`  inquiry:   GET  /api/v1/credit-consumption/inquiry?referenceNumber=<from purchase>`);
  console.log(`  confirm:   POST /api/v1/credit-consumption/confirm { referenceNumber }`);
  console.log(`\nsample shapes: ${summary(balance).slice(0, 200)}…`);
}

main().catch((error) => {
  console.error(`\nFAIL: ${error.message}`);
  if (error.cause?.code) console.error(`  cause: ${error.cause.code}`);
  process.exit(1);
});
