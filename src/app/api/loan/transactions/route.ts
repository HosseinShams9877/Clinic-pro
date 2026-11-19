/**
 * GET /api/loan/transactions?nationalCode=…&fromDate=…&toDate=… — the
 * bank's transaction list (JetPay §1-14), proxied with the range
 * constraints the bank publishes (max one month per request).
 *
 * The wizard shows the user their own recent loan transactions for the
 * given national code — nothing more (no panel, no aggregate view).
 */

import { NextResponse } from "next/server";

import { FixedWindowRateLimiter } from "@/core/rateLimit";
import { LOAN_RATE_LIMITS } from "@/modules/loan/constants";
import { transactionsRequestSchema } from "@/modules/loan/schemas/loanSchemas";
import { getLoanService } from "@/modules/loan/services/loanService";
import { clientIp, jsonError, jsonOk, loanErrorResponse } from "@/modules/loan/lib/routeHandler";

export const dynamic = "force-dynamic";

const LIMITER = new FixedWindowRateLimiter(LOAN_RATE_LIMITS.transactions.limit, LOAN_RATE_LIMITS.transactions.windowMs);

/** The bank accepts at most a one-month range per request (§1-14). */
const MAX_RANGE_DAYS = 31;

export async function GET(request: Request): Promise<NextResponse> {
  if (!LIMITER.allow(clientIp(request))) {
    return jsonError(429, "Too Many Requests");
  }
  try {
    const url = new URL(request.url);
    const parsed = transactionsRequestSchema.safeParse({
      nationalCode: url.searchParams.get("nationalCode") ?? "",
      fromDate: url.searchParams.get("fromDate") ?? "",
      toDate: url.searchParams.get("toDate") ?? "",
      page: url.searchParams.get("page") ?? undefined,
      size: url.searchParams.get("size") ?? undefined,
    });
    if (!parsed.success) {
      return jsonError(400, "Invalid query parameters.");
    }
    const rangeDays = (Date.parse(parsed.data.toDate) - Date.parse(parsed.data.fromDate)) / 86_400_000;
    if (!Number.isFinite(rangeDays) || rangeDays < 0 || rangeDays > MAX_RANGE_DAYS) {
      return jsonError(400, "Date range must be at most one month.");
    }
    return jsonOk(await getLoanService().transactions(parsed.data));
  } catch (error) {
    return loanErrorResponse(error);
  }
}
