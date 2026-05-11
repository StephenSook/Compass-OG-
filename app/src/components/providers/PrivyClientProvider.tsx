"use client";

import dynamic from "next/dynamic";
import {
  PRIVY_APP_ID,
  activeChain,
  zeroGAristotleMainnet,
  zeroGGalileoTestnet,
} from "@/lib/chains";
import type { ReactNode } from "react";

// Privy ships ~1.2 MB of vendor JS. Static-import would hoist it into the
// root layout chunk and ship it on every route — including /verify, which
// does not use a wallet. Dynamic-import keeps the chunk lazy: the bundle
// only loads when PRIVY_APP_ID is set AND this provider mounts.
const PrivyProvider = dynamic(
  () => import("@privy-io/react-auth").then((m) => m.PrivyProvider),
  { ssr: false },
);

// Mounts PrivyProvider only when NEXT_PUBLIC_PRIVY_APP_ID is set; otherwise
// children render directly so /onboard step 1 stays the 800ms fixture timer.
export function PrivyClientProvider({ children }: { children: ReactNode }) {
  if (PRIVY_APP_ID === null) return <>{children}</>;

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
