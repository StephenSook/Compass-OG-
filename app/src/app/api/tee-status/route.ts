// Public probe of the Compass TEE enclave health. Returns the enclave's
// /health JSON when reachable, plus the configured base URL (for transparency
// / verifiability), and a short `mode` summary that the /about page or other
// surfaces can render without forcing a full /api/consume call.
//
// Stays open (no auth) — the enclave URL + signer address + composeHash are
// all already published in docs/notes/phala-deployment.md.
//
// Cache + rate limit: every cold request triggers an outbound fetch to the
// Phala dstack URL. OWASP API4 / API6 (2026-05-11): flood would amplify into
// Phala's billing meter + Vercel function budget. Two mitigations:
//   1. 10-second edge cache via Cache-Control s-maxage. Liveness data is
//      fine if 10s stale — that's smaller than the propagation lag on the
//      Phala CVM start/stop cycle. Eliminates 99% of flood amplification.
//   2. Same 5/min/IP rate limit as /api/consume + /api/issue, in case the
//      attacker's IPs hit cold-start paths that bypass the edge cache.

import { NextResponse } from "next/server";
import { getEnclaveUrl, probeEnclaveHealth } from "@/lib/compassEnclave";
import { check as rateLimitCheck, createBucketStore, extractClientIp } from "@/lib/ratelimit";

const RATE_LIMIT_STORE = createBucketStore();

export const runtime = "nodejs";

// Removed `dynamic = "force-dynamic"` — that defeated the edge cache.
// Cache-Control headers below now do the work.

const CACHE_HEADERS = {
  // 10-second s-maxage covers the CDN cache; max-age=0 ensures browsers
  // re-validate on direct refresh.
  "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=30",
} as const;

export async function GET(req: Request) {
  const clientIp = extractClientIp(req.headers);
  const rl = rateLimitCheck(RATE_LIMIT_STORE, clientIp);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: `Too many requests — try again in ${Math.ceil(rl.resetMs / 1000)}s.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.resetMs / 1000)),
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  const enclaveUrl = getEnclaveUrl();
  if (!enclaveUrl) {
    return NextResponse.json(
      {
        mode: "unconfigured",
        enclaveUrl: null,
        reachable: false,
        message:
          "COMPASS_ENCLAVE_URL is not set. /api/consume falls back to the named stub digest.",
      },
      { headers: CACHE_HEADERS },
    );
  }
  const probe = await probeEnclaveHealth(enclaveUrl);
  if (!probe.ok) {
    return NextResponse.json(
      {
        mode: "degraded",
        enclaveUrl,
        reachable: false,
        message:
          "Enclave configured but unreachable. /api/consume falls back to the named stub digest.",
      },
      { headers: CACHE_HEADERS },
    );
  }
  return NextResponse.json(
    {
      mode: probe.source === "tee" ? "tee" : "env",
      enclaveUrl,
      reachable: true,
      signer: probe.signer ?? null,
      source: probe.source ?? null,
    },
    { headers: CACHE_HEADERS },
  );
}
