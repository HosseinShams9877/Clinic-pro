/**
 * POST /api/loan/inquiry — credit inquiry (JetPay §1-5).
 *
 * Validates the national code, asks the service for the customer's
 * credits, returns the credits + the bank's requestId that the later
 * steps must echo. Rate-limited per IP.
 */

import { NextResponse } from "next/server";

import { FixedWindowRateLimiter } from "@/core/rateLimit";
import { LOAN_RATE_LIMITS } from "@/modules/loan/constants";
import { inquiryRequestSchema } from "@/modules/loan/schemas/loanSchemas";
import { getLoanService } from "@/modules/loan/services/loanService";
import { clientIp, jsonError, jsonOk, loanErrorResponse } from "@/modules/loan/lib/routeHandler";

export const dynamic = "force-dynamic";

const LIMITER = new FixedWindowRateLimiter(LOAN_RATE_LIMITS.inquiry.limit, LOAN_RATE_LIMITS.inquiry.windowMs);

export async function POST(request: Request): Promise<NextResponse> {
  if (!LIMITER.allow(clientIp(request))) {
    return jsonError(429, "Too Many Requests");
  }
  try {
    const parsed = inquiryRequestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return jsonError(400, "Invalid national code.");
    }
    return jsonOk(await getLoanService().inquire(parsed.data.nationalCode));
  } catch (error) {
    return loanErrorResponse(error);
  }
}
