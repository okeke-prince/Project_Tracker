// A small in-memory limiter for sign-in and sign-up. It counts attempts per key in a fixed
// window. Counts live in this server process, which suits a single-server SQLite deploy;
// running several servers would need a shared store such as Redis instead.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Records one attempt. Returns false once `key` has used up `limit` attempts in the window. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

/** Best guess at the caller's IP from proxy headers. */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

export const FIFTEEN_MINUTES = 15 * 60 * 1000;
export const ONE_HOUR = 60 * 60 * 1000;
