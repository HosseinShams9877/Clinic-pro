/**
 * POST /api/loan/send-otp — request the bank's one-time password (JetPay §1-6).
 *
 * The tightest rate limit of the flow: an OTP costs the merchant an SMS.
 * The service deduplicates repeat requests within the bank's own resend
 * cooldown, so a double-click costs one message, not two.
 */

import { NextResponse } from "next/server";

import { FixedWindowRateLimiter } from "@/core/rateLimit";
import { LOAN_RATE_LIMITS } from "@/modules/loan/constants";
import { sendOtpRequestSchema } from "@/modules/loan/schemas/loanSchemas";
import { getLoanService } from "@/modules/loan/services/loanService";
import { clientIp, jsonError, jsonOk, loanErrorResponse } from "@/modules/loan/lib/routeHandler";

export const dynamic = "force-dynamic";

const LIMITER = new FixedWindowRateLimiter(LOAN_RATE_LIMITS.sendOtp.limit, LOAN_RATE_LIMITS.sendOtp.windowMs);

export async function POST(request: Request): Promise<NextResponse> {
  if (!LIMITER.allow(clientIp(request))) {
    return jsonError(429, "Too Many Requests");
  }
  try {
    const parsed = sendOtpRequestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return jsonError(400, "Invalid request parameters.");
    }
    return jsonOk(await getLoanService().sendOtp(parsed.data));
  } catch (error) {
    return loanErrorResponse(error);
  }
}
