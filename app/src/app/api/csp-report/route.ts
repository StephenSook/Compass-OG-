// CSP violation reporter endpoint. Browsers POST violation reports here
// when our `Content-Security-Policy-Report-Only` directive trips. Logs to
// the Vercel function log so an operator can see what would break under
// an enforced CSP before flipping to enforce in v0.6.
//
// Without this endpoint, the Report-Only header in app/next.config.ts was
// theatre — violations were emitted to the browser console only, and the
// "signal the security posture without breakage" comment was unsupported
// (silent-failure-hunter 2026-05-11).
//
// We deliberately do NOT respond with anything except 204; the browser
// doesn't read the response body for CSP reports. The endpoint is
// rate-limited (same 5/min/IP pattern as /api/consume + /api/issue) in
// case an attacker tries to spam violation reports as a log-amplification
// attack.

import { NextResponse } from "next/server";
import { check as rateLimitCheck, createBucketStore, extractClientIp } from "@/lib/ratelimit";

const RATE_LIMIT_STORE = createBucketStore();

export const runtime = "nodejs";

export async function POST(req: Request) {
  const clientIp = extractClientIp(req.headers);
  const rl = rateLimitCheck(RATE_LIMIT_STORE, clientIp);
  if (!rl.ok) {
    // Reports are best-effort; drop silently with 429 on flood.
    return new NextResponse(null, { status: 429 });
  }
  try {
    // Read but truncate. The "csp-report" key is the legacy structure;
    // "csp-report-to" is newer. We log a slice so giant payloads can't
    // fill Vercel's per-request log limit.
    const text = await req.text();
    console.warn("[csp-report]", text.slice(0, 1024));
  } catch (err) {
    console.warn("[csp-report] failed to read body", err);
  }
  return new NextResponse(null, { status: 204 });
}
