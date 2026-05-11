// In-memory IP-based rate limiter for /api/consume.
//
// Why this exists: /api/consume is a server-side relayer. Each call spends
// gas from the PROVIDER_PRIVATE_KEY wallet on Aristotle mainnet. Without a
// limiter, an attacker who minted a valid agent NFT could submit many
// distinct EIP-712 grants (each with a unique nullifier) and force the
// relayer to drain its balance. The contract's nullifier-replay protection
// prevents reusing one grant, but does nothing about a flood of *new*
// grants from a single client.
//
// Implementation: a Map keyed by the client IP (extracted only when the
// process is running on Vercel) holding a sliding window of timestamps.
// On each request, we evict timestamps older than WINDOW_MS, then check
// the remaining count against LIMIT. Empty buckets are deleted so the
// Map doesn't leak under high-cardinality input. Total keys are also
// capped at MAX_KEYS — if we hit the cap we evict the oldest bucket to
// make room.
//
// Honest limits:
//  - Vercel Functions are stateless across cold starts; this Map lives
//    inside one warm instance. A determined attacker that triggers cold
//    starts (or hits multiple Vercel regions) bypasses the in-memory
//    bucket. The right v2 fix is Vercel KV / Upstash Redis. Tracked in
//    docs/honest-limits.md.
//  - We trust the x-forwarded-for header ONLY when process.env.VERCEL is
//    set — i.e., when the runtime confirms we are behind the Vercel
//    edge, which itself sets the header from the actual TCP source IP.
//    On any other deployment path, callers can send arbitrary
//    x-forwarded-for values; outside Vercel we fall back to a single
//    shared bucket so the limiter still bites but cannot be bypassed
//    via header spoofing.

export type RateLimitResult =
  | { ok: true; remaining: number; resetMs: number }
  | { ok: false; remaining: 0; resetMs: number };

const WINDOW_MS = 60_000;
const LIMIT = 5;
const MAX_KEYS = 10_000;

export type BucketStore = Map<string, number[]>;

export function createBucketStore(): BucketStore {
  return new Map();
}

export function extractClientIp(headers: Headers): string {
  // Only trust forwarding headers when the runtime confirms we are
  // behind Vercel's edge — Vercel sets x-forwarded-for from the actual
  // TCP source IP at its CDN layer. Outside Vercel the headers are
  // attacker-controllable.
  if (process.env.VERCEL === "1") {
    const xff = headers.get("x-forwarded-for");
    if (xff) return xff.split(",")[0]!.trim();

    const xri = headers.get("x-real-ip");
    if (xri) return xri.trim();
  }

  return "shared-bucket";
}

export function check(
  store: BucketStore,
  key: string,
  now: number = Date.now(),
): RateLimitResult {
  const windowStart = now - WINDOW_MS;
  const existing = store.get(key) ?? [];
  const live = existing.filter((t) => t > windowStart);

  if (live.length >= LIMIT) {
    const oldest = live[0]!;
    store.set(key, live);
    return {
      ok: false,
      remaining: 0,
      resetMs: Math.max(0, oldest + WINDOW_MS - now),
    };
  }

  live.push(now);
  store.set(key, live);

  if (store.size > MAX_KEYS) evictOldest(store, now);

  const oldest = live[0]!;
  return {
    ok: true,
    remaining: LIMIT - live.length,
    resetMs: Math.max(0, oldest + WINDOW_MS - now),
  };
}

// Cleans up buckets whose entries have all expired. Called by check()
// when the store grows past MAX_KEYS; also safe to call from a periodic
// timer if a future maintainer wants more aggressive pruning.
export function evictOldest(store: BucketStore, now: number = Date.now()): void {
  const windowStart = now - WINDOW_MS;
  for (const [k, ts] of store) {
    const live = ts.filter((t) => t > windowStart);
    if (live.length === 0) {
      store.delete(k);
    } else if (live.length < ts.length) {
      store.set(k, live);
    }
  }
}
