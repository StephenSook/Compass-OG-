import type { NextConfig } from "next";

// Security headers applied to every response.
//
// HSTS is already set by Vercel at the edge with preload — confirmed via
// `curl -sI https://app-psi-pied.vercel.app/` returning
// `strict-transport-security: max-age=63072000; includeSubDomains; preload`.
// We also set HSTS here so non-Vercel deployments (self-hosted, Docker)
// retain the property.
//
// CSP is shipped in **report-only** mode in v0.5. A strict enforced CSP
// requires nonce strategies for Next inline scripts plus carefully
// allow-listed third-party domains (Privy, Phala, 0G RPC, Spline,
// 3d-force-graph CDN); we don't want a misconfigured CSP to break the
// demo on a judge's first click. Report-only signals the security
// posture without breakage; v0.6 graduates to enforce. Tracked in
// docs/honest-limits.md.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://auth.privy.io https://*.privy.io https://*.privy.systems https://prod.spline.design https://unpkg.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://auth.privy.io https://*.privy.io https://*.privy.systems https://*.dstack-pha-prod9.phala.network https://evmrpc.0g.ai https://evmrpc-testnet.0g.ai https://chainscan.0g.ai https://chainscan-galileo.0g.ai https://prod.spline.design https://hub.0g.ai wss://*.privy.io",
  "frame-src 'self' https://auth.privy.io https://*.privy.io",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy-Report-Only",
    value: CSP_REPORT_ONLY,
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
