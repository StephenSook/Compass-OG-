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
