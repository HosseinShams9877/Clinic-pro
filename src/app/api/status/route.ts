/**
 * app/api/status/route.ts — the live admissions status endpoint (P1-13).
 *
 * The single client-side server-state need in the implemented scope: the
 * home-page open/closed badge. This route computes the snapshot from the
 * domain core (no business logic here — CLAUDE.md §5) and returns the
 * Zod-shaped payload the React Query client re-validates on arrival with the
 * dependency-free mirror (P2 item 9: the client no longer ships Zod just to
 * parse one object).
 *
 * Semantics mirror پلتفرم/assets/js/home.js exactly: Asia/Tehran wall clock,
 * Saturday–Thursday 07:30–20:00 (minutes 450 ≤ m < 1200), closed all Friday.
 *
 * Responses are public-cacheable for 30 s (the badge polls every 60 s, so a
 * little staleness trading for a CDN hit is the reference's own posture).
 * A fixed-window limiter caps abuse at 60 requests / 60 s per IP.
 */

import { NextResponse } from "next/server";

import { statusFor } from "@/core/openHours";
import { FixedWindowRateLimiter } from "@/core/rateLimit";
import { statusPayload } from "@/modules/services/queries/statusQueries";
import { statusResponseSchema } from "@/modules/services/schemas/statusSchema";

export const dynamic = "force-dynamic";

/** 60 requests / 60 s per IP — the badge polls once per minute; anything
 *  faster is not our own traffic. */
const LIMITER = new FixedWindowRateLimiter(60, 60_000);

export function GET(request: Request): NextResponse {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!LIMITER.allow(ip)) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  // Validate at the edge itself (CLAUDE.md §5): a payload that fails the
  // contract is a bug in core/openHours, not a client problem — fail loudly
  // here instead of shipping garbage the badge has to reject.
  const payload = statusResponseSchema.parse(statusPayload(statusFor(new Date())));
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=30, s-maxage=30",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
