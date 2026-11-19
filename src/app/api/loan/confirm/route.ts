/**
 * POST /api/loan/confirm — final confirmation (JetPay §1-9).
 *
 * The PDF's precondition: only call this once the purchase transaction
 * has reached COMPLETED (the wizard polls /status first). If called
 * early, the bank answers TRANSACTION_NOT_COMPLETED, which we surface.
 * After 60 minutes without confirmation the bank auto-expires the
 * purchase and returns the credit — the wizard offers a restart then.
 */

import { NextResponse } from "next/server";

import { FixedWindowRateLimiter } from "@/core/rateLimit";
import { LOAN_RATE_LIMITS } from "@/modules/loan/constants";
import { confirmRequestSchema } from "@/modules/loan/schemas/loanSchemas";
import { getLoanService } from "@/modules/loan/services/loanService";
import { clientIp, jsonError, jsonOk, loanErrorResponse } from "@/modules/loan/lib/routeHandler";

export const dynamic = "force-dynamic";

const LIMITER = new FixedWindowRateLimiter(LOAN_RATE_LIMITS.confirm.limit, LOAN_RATE_LIMITS.confirm.windowMs);

export async function POST(request: Request): Promise<NextResponse> {
  if (!LIMITER.allow(clientIp(request))) {
    return jsonError(429, "Too Many Requests");
  }
  try {
    const parsed = confirmRequestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return jsonError(400, "Invalid reference number.");
    }
    return jsonOk(await getLoanService().confirm(parsed.data.referenceNumber));
  } catch (error) {
    return loanErrorResponse(error);
  }
}
