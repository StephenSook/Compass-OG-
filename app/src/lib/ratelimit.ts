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

  if (store.size > MAX_KEYS) {
    const evicted = evictOldest(store, now);
    // silent-failure-hunter 2026-05-11: if every bucket has at least one
    // live timestamp (10K+ distinct IPs within WINDOW_MS = flood
    // scenario), evictOldest is a no-op and the Map grows unbounded.
    // Force-evict the single oldest-timestamp bucket as a true LRU
    // fallback + warn so the pressure is observable in Vercel logs.
    if (evicted === 0 && store.size > MAX_KEYS) {
      forceLruEvict(store);
      console.warn(
        "[ratelimit] MAX_KEYS pressure under flood — forced LRU evict; consider Vercel KV migration (v0.6)",
      );
    }
  }

  const oldest = live[0]!;
  return {
    ok: true,
    remaining: LIMIT - live.length,
    resetMs: Math.max(0, oldest + WINDOW_MS - now),
  };
}

// Cleans up buckets whose entries have all expired. Returns the count
// of buckets actually deleted so check() can detect an under-pressure
// no-op and force a true LRU eviction.
export function evictOldest(store: BucketStore, now: number = Date.now()): number {
  const windowStart = now - WINDOW_MS;
  let deleted = 0;
  for (const [k, ts] of store) {
    const live = ts.filter((t) => t > windowStart);
    if (live.length === 0) {
      store.delete(k);
      deleted++;
    } else if (live.length < ts.length) {
      store.set(k, live);
    }
  }
  return deleted;
}

// True LRU fallback: deletes the bucket whose oldest timestamp is the
// smallest (i.e., the bucket that has been "stuck" the longest). Used
// when evictOldest() returned 0 but we're still over MAX_KEYS — see
// the silent-failure note in check().
function forceLruEvict(store: BucketStore): void {
  let oldestKey: string | null = null;
  let oldestTs = Number.POSITIVE_INFINITY;
  for (const [k, ts] of store) {
    if (ts.length === 0) continue;
    if (ts[0]! < oldestTs) {
      oldestTs = ts[0]!;
      oldestKey = k;
    }
  }
  if (oldestKey !== null) store.delete(oldestKey);
}
