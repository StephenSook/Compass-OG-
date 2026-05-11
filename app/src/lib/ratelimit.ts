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
// Implementation: a Map keyed by the client IP (from
// x-forwarded-for / x-real-ip) holding a sliding window of timestamps.
// On each request, we evict timestamps older than WINDOW_MS, then check
// the remaining count against LIMIT.
//
// Honest limits:
//  - Vercel Functions are stateless across cold starts; this Map lives
//    inside one warm instance. A determined attacker that triggers cold
//    starts (or hits multiple Vercel regions) bypasses the in-memory
//    bucket. The right v2 fix is Vercel KV / Upstash Redis. Tracked in
//    docs/honest-limits.md.
//  - We trust the x-forwarded-for header. Vercel sets this from the
//    actual TCP source IP at its edge; spoofing requires bypassing the
//    edge, which is the same threat surface as bypassing the entire
//    Vercel CDN. Good enough for the hackathon window.

export type RateLimitResult =
  | { ok: true; remaining: number; resetMs: number }
  | { ok: false; remaining: 0; resetMs: number };

const WINDOW_MS = 60_000; // 1 minute
const LIMIT = 5;          // 5 requests per minute per IP

// One Map per route; the caller passes its own to avoid cross-route bleed.
export type BucketStore = Map<string, number[]>;

export function createBucketStore(): BucketStore {
  return new Map();
}

export function extractClientIp(headers: Headers): string {
  // Vercel forwards the public client IP in x-forwarded-for. The first
  // entry is the original client; subsequent entries are proxy hops.
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();

  const xri = headers.get("x-real-ip");
  if (xri) return xri.trim();

  // Local dev / non-Vercel fallback. Pinning to a constant means everyone
  // shares one bucket — fine for dev because we hit the route a few
  // times and want the limit to actually trip during testing.
  return "local-fallback";
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
    return {
      ok: false,
      remaining: 0,
      resetMs: Math.max(0, oldest + WINDOW_MS - now),
    };
  }

  live.push(now);
  store.set(key, live);
  return {
    ok: true,
    remaining: LIMIT - live.length,
    resetMs: WINDOW_MS,
  };
}
