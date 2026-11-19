/**
 * POST /api/loan/verify — OTP verification: the JetPay purchase (§1-8).
 *
 * Guards the sequence: the service rejects a purchase for a national
 * code + requestId that never requested an OTP (the bank would too —
 * OTP_NOT_SENT — but our check keeps the state machine honest locally).
 */

import { NextResponse } from "next/server";

import { FixedWindowRateLimiter } from "@/core/rateLimit";
import { LOAN_RATE_LIMITS } from "@/modules/loan/constants";
import { verifyRequestSchema } from "@/modules/loan/schemas/loanSchemas";
import { getLoanService } from "@/modules/loan/services/loanService";
import { clientIp, jsonError, jsonOk, loanErrorResponse } from "@/modules/loan/lib/routeHandler";

export const dynamic = "force-dynamic";

const LIMITER = new FixedWindowRateLimiter(LOAN_RATE_LIMITS.verify.limit, LOAN_RATE_LIMITS.verify.windowMs);

export async function POST(request: Request): Promise<NextResponse> {
  if (!LIMITER.allow(clientIp(request))) {
    return jsonError(429, "Too Many Requests");
  }
  try {
    const parsed = verifyRequestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return jsonError(400, "Invalid request parameters.");
    }
    return jsonOk(await getLoanService().verify(parsed.data));
  } catch (error) {
    return loanErrorResponse(error);
  }
}
