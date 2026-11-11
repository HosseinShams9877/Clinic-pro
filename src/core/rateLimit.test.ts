/**
 * rateLimit.test.ts — the fixed-window limiter behind GET /api/status.
 *
 * Pinned: the window is fixed (a burst of `limit` is allowed, the next request
 * in the SAME window is denied, and a NEW window admits again), and keys are
 * independent — one abusive client never starves another.
 *
 * The limiter is deterministic: `allow` takes an explicit clock so the route
 * test does not have to wait out a real window.
 */

import { describe, expect, it } from "vitest";

import { FixedWindowRateLimiter } from "./rateLimit";

describe("FixedWindowRateLimiter", () => {
  it("allows exactly `limit` requests in a window", () => {
    const limiter = new FixedWindowRateLimiter(3, 60_000);
    expect(limiter.allow("1.1.1.1", 0)).toBe(true);
    expect(limiter.allow("1.1.1.1", 1_000)).toBe(true);
    expect(limiter.allow("1.1.1.1", 2_000)).toBe(true);
  });

  it("denies the request that exceeds the limit within the same window", () => {
    const limiter = new FixedWindowRateLimiter(3, 60_000);
    for (let i = 0; i < 3; i += 1) limiter.allow("2.2.2.2", i * 100);
    expect(limiter.allow("2.2.2.2", 30_000)).toBe(false);
    expect(limiter.allow("2.2.2.2", 59_999)).toBe(false);
  });

  it("admits again once a new window starts", () => {
    const limiter = new FixedWindowRateLimiter(3, 60_000);
    for (let i = 0; i < 3; i += 1) limiter.allow("3.3.3.3", i * 100);
    expect(limiter.allow("3.3.3.3", 60_000)).toBe(true);
    expect(limiter.allow("3.3.3.3", 60_001)).toBe(true);
    expect(limiter.allow("3.3.3.3", 60_002)).toBe(true);
    expect(limiter.allow("3.3.3.3", 60_003)).toBe(false);
  });

  it("tracks keys independently", () => {
    const limiter = new FixedWindowRateLimiter(2, 60_000);
    expect(limiter.allow("a", 0)).toBe(true);
    expect(limiter.allow("a", 1)).toBe(true);
    expect(limiter.allow("a", 2)).toBe(false);
    expect(limiter.allow("b", 3)).toBe(true);
    expect(limiter.allow("b", 4)).toBe(true);
    expect(limiter.allow("b", 5)).toBe(false);
  });

  it("prunes stale entries so the bucket map cannot grow unboundedly", () => {
    const limiter = new FixedWindowRateLimiter(5, 60_000);
    // A pile of buckets whose windows are all long closed...
    for (let i = 0; i < 100; i += 1) limiter.allow(`stale-${i}`, i);
    // ...and one fresh key, whose next hit triggers prune().
    limiter.allow("fresh", 1_000_000);
    expect(limiter.size()).toBe(101);
    expect(limiter.allow("fresh", 1_001_000)).toBe(true);
    expect(limiter.size()).toBe(1); // only the fresh key survives
  });
});
