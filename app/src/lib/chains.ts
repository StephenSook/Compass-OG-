import { defineChain } from "viem";

export const zeroGGalileoTestnet = defineChain({
  id: 16602,
  name: "0G Galileo Testnet",
  nativeCurrency: { name: "OG", symbol: "OG", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
  blockExplorers: {
    default: {
      name: "chainscan-galileo",
      url: "https://chainscan-galileo.0g.ai",
    },
  },
  testnet: true,
});

export const zeroGAristotleMainnet = defineChain({
  id: 16661,
  name: "0G Aristotle",
  nativeCurrency: { name: "OG", symbol: "OG", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc.0g.ai"] },
  },
  blockExplorers: {
    default: {
      name: "chainscan",
      url: "https://chainscan.0g.ai",
    },
  },
});

export const PRIVY_APP_ID: string | null =
  process.env.NEXT_PUBLIC_PRIVY_APP_ID || null;

export const isPrivyEnabled = (): boolean => PRIVY_APP_ID !== null;

// A.5 mainnet activation. Until NEXT_PUBLIC_COMPASS_USE_MAINNET=1 is set
// AND Aristotle contract addresses are filled in (currently zero), every
// surface stays on Galileo testnet. The selector is read at module load
// time on the server and at hydration time on the client; both call sites
// reach the same value because the env var is NEXT_PUBLIC_*.
export type CompassNetwork = "galileo" | "aristotle";

export const useMainnet = (): boolean =>
  process.env.NEXT_PUBLIC_COMPASS_USE_MAINNET === "1";

export const activeNetwork = (): CompassNetwork =>
  useMainnet() ? "aristotle" : "galileo";

export const activeChain = () =>
  useMainnet() ? zeroGAristotleMainnet : zeroGGalileoTestnet;
