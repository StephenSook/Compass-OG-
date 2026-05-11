import type { NextConfig } from "next";

// Security headers applied to every response.
//
// HSTS is already set by Vercel at the edge with preload — confirmed via
// `curl -sI https://app-psi-pied.vercel.app/` returning
// `strict-transport-security: max-age=63072000; includeSubDomains; preload`.
// The headers below complement that with the four non-CSP defenses that
// have zero risk of breaking third-party integrations (Privy, Phala TEE,
// Aristotle/Galileo RPC, Spline runtime, etc).
//
// CSP is intentionally NOT enforced here. The Compass app loads from
// auth.privy.io, dstack-pha-prod9.phala.network, evmrpc(-testnet).0g.ai,
// prod.spline.design, and unpkg.com (for the standalone 3D force-graph
// view at /audit-graph.html). A strict CSP requires careful per-domain
// allow-listing AND a nonce strategy for Next.js inline scripts;
// hackathon-stage we'd rather omit CSP than ship one that breaks the
// demo on a judge's first click. Tracked for v2 in docs/honest-limits.md.
const securityHeaders = [
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
