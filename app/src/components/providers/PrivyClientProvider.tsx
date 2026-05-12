"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  PRIVY_APP_ID,
  activeChain,
  zeroGAristotleMainnet,
  zeroGGalileoTestnet,
} from "@/lib/chains";

// Privy ships ~1.2 MB of vendor JS. We dynamic-import so the chunk loads
// lazily, but the provider sits at root layout — so we MUST render
// {children} pass-through on SSR + first hydration, otherwise the
// ssr:false wrapper would render null and swallow every server-rendered
// page on the entire site.
//
// The pattern below: mount Privy ONLY after the client has hydrated AND
// PRIVY_APP_ID is set. Until then, render {children} directly so SSR
// works for /about, /faq, /roadmap, /audit, /clinic/*, /vault, /analytics,
// /demo, /policies/*, /receipt/* — none of those need a wallet provider.
//
// Failure handling: if the Privy chunk fails to load (CDN 4xx, offline,
// ad-blocker, stale _next/static after deploy invalidation), the dynamic
// import rejects and PrivyProvider stays null — the route degrades to
// the fixture-timer path on /onboard step 1, NOT to a white-screen.
const PrivyProvider = dynamic(
  () => import("@privy-io/react-auth").then((m) => m.PrivyProvider),
  { ssr: false, loading: () => null },
);

export function PrivyClientProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // SSR + dev (no APP_ID) + post-hydration-before-Privy-chunk-loaded:
  // emit children directly so server-rendered HTML is correct.
  if (PRIVY_APP_ID === null || !mounted) return <>{children}</>;

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#3b82f6",
          logo: undefined,
          showWalletLoginFirst: false,
        },
        loginMethods: ["email", "google"],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
        // defaultChain tracks the env flag so the wallet provisions on
        // the active network. supportedChains lists both so the wallet
        // can switch when needed (mainnet for the demo recording cycle,
        // testnet for ongoing development).
        defaultChain: activeChain(),
        supportedChains: [zeroGGalileoTestnet, zeroGAristotleMainnet],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
