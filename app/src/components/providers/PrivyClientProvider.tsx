"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { PRIVY_APP_ID, zeroGGalileoTestnet } from "@/lib/chains";
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
        defaultChain: zeroGGalileoTestnet,
        supportedChains: [zeroGGalileoTestnet],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
