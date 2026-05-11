"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import {
  PRIVY_APP_ID,
  activeChain,
  zeroGAristotleMainnet,
  zeroGGalileoTestnet,
} from "@/lib/chains";
import type { ReactNode } from "react";

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
