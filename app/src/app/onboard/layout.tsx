import type { ReactNode } from "react";

// /onboard is wallet-gated — useWallets() from @privy-io/react-auth fires
// during the wallet step. The root-layout PrivyClientProvider uses a
// mounted-flag pattern to keep SSR working for non-Privy pages (commit
// a332736), which means PrivyProvider is NOT mounted at prerender time.
// If Next tries to statically prerender /onboard, useWallets() throws
// "called outside the PrivyProvider component" and the build dies.
//
// Force the entire /onboard segment to render at request time so the
// client picks up + mounted-flag → Privy mounts → useWallets works.
// Verified against the failed prod deploy 2026-05-11T23:53.
export const dynamic = "force-dynamic";

export default function OnboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
