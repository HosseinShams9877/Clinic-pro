/**
 * routeHandler.ts — shared HTTP-shape helpers for the loan Route Handlers.
 *
 * Pure mapping only (no business logic — CLAUDE.md §5): the routes import
 * this to turn a Zod failure, a rate-limit hit, or a JetPayError into the
 * one error envelope the client consumes:
 *
 *   { error: string, fa?: string, code?: number }
 *
 * Status codes:
 *   400 bad request        — Zod rejected the input (client bug/typo)
 *   405 method not allowed — the route is not that verb
 *   429 too many requests  — rate limit hit
 *   503 service unavailable— the bank was unreachable (transient)
 *   502 bad gateway        — the bank answered with success:false
 *   500 internal error     — anything else; the message stays generic
 *
 * The bank's `fa` message is forwarded so the UI can show the bank's own
 * wording (e.g. "کد وارد شده صحیح نمی‌باشد"), exactly as the PDF's
 * response model intends. No credential or token ever appears here.
 */

import { NextResponse } from "next/server";

import { JetPayError } from "../services/jetpay";

const JSON_UTF8 = { "Content-Type": "application/json; charset=utf-8" } as const;

export function jsonOk(body: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(body, { ...init, headers: { ...JSON_UTF8, ...(init?.headers ?? {}) } });
}

export function jsonError(status: number, error: string, extras?: { fa?: string; code?: number }): NextResponse {
  return NextResponse.json({ error, ...extras }, { status, headers: JSON_UTF8 });
}

/** Map any thrown value to the error envelope (returns it for the route). */
export function loanErrorResponse(error: unknown): NextResponse {
  if (error instanceof JetPayError) {
    if (error.code === 0) {
      return jsonError(503, error.en, { fa: error.fa, code: 0 });
    }
    return jsonError(502, error.en, { fa: error.fa, code: error.code });
  }
  if (error instanceof Error && error.name === "ZodError") {
    return jsonError(400, "Invalid request parameters.");
  }
  return jsonError(500, "Internal error. Please try again later.");
}

/** The client IP, in the same posture as /api/status (x-forwarded-for). */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
