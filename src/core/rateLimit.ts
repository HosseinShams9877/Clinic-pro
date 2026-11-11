/**
 * rateLimit.ts — in-memory fixed-window rate limiter for the API edge.
 *
 * Infrastructure for the Route Handler (P1-13), not business logic. Fixed
 * window per key (the caller passes the client IP): N requests / windowMs,
 * then 429. The window is kept per server instance in memory — deliberately
 * simple, no external store — and reset by the first request of a window.
 * A stale key is pruned on every check so a long-lived instance does not
 * accumulate entries.
 */

type Bucket = { count: number; windowStart: number };

export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** True when the request is allowed (and counted); false when over quota. */
  allow(key: string, now: number = Date.now()): boolean {
    const bucket = this.buckets.get(key);
    if (bucket === undefined || now - bucket.windowStart >= this.windowMs) {
      this.buckets.set(key, { count: 1, windowStart: now });
      return 1 <= this.limit;
    }
    bucket.count += 1;
    this.prune(now);
    return bucket.count <= this.limit;
  }

  /** Number of tracked keys (test/ops observability). */
  size(): number {
    return this.buckets.size;
  }

  /** Drop closed buckets (bounded memory). */
  private prune(now: number): void {
    for (const [key, bucket] of this.buckets) {
      if (now - bucket.windowStart >= this.windowMs) this.buckets.delete(key);
    }
  }
}
