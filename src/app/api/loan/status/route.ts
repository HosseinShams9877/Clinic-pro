/**
 * GET /api/loan/status?referenceNumber=… — transaction status (JetPay §1-13).
 *
 * Used by the wizard to poll the purchase's progress; the service also
 * reconciles our LoanRequest rows from the bank's step list.
 */

import { NextResponse } from "next/server";

import { FixedWindowRateLimiter } from "@/core/rateLimit";
import { LOAN_RATE_LIMITS } from "@/modules/loan/constants";
import { statusRequestSchema } from "@/modules/loan/schemas/loanSchemas";
import { getLoanService } from "@/modules/loan/services/loanService";
import { clientIp, jsonError, jsonOk, loanErrorResponse } from "@/modules/loan/lib/routeHandler";

export const dynamic = "force-dynamic";

const LIMITER = new FixedWindowRateLimiter(LOAN_RATE_LIMITS.status.limit, LOAN_RATE_LIMITS.status.windowMs);

export async function GET(request: Request): Promise<NextResponse> {
  if (!LIMITER.allow(clientIp(request))) {
    return jsonError(429, "Too Many Requests");
  }
  try {
    const url = new URL(request.url);
    const parsed = statusRequestSchema.safeParse({
      referenceNumber: url.searchParams.get("referenceNumber") ?? "",
    });
    if (!parsed.success) {
      return jsonError(400, "Invalid reference number.");
    }
    return jsonOk(await getLoanService().status(parsed.data.referenceNumber));
  } catch (error) {
    return loanErrorResponse(error);
  }
}
