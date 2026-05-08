// Galileo testnet contract addresses + minimal ABI surface used by the
// frontend. Sourced from docs/deployments/og_galileo.json (deployer
// 0x05b5Bb550eb8401fC4b8a33bf566C03f49ef5d34, deployedAt 2026-05-07).
//
// Mainnet (Aristotle, chainId 16661) deploy is gated on funding — see
// docs/notes/0g-ecosystem-status.md for the credits-request status.

import type { Abi, Address } from "viem";

export const AGENT_REGISTRY_GALILEO: Address =
  "0x461eda452ffAF43c674ef42BdccfDd6B8e13C2D8";

export const COMPASS_HUB_GALILEO: Address =
  "0x60BbE5fcA6D23f7d25142E721258c641b45A7c3b";

// Minimal ABI — only the surface used by /onboard. The full ABI lives
// at contracts/typechain-types/contracts/AgentRegistry.ts; rebuild via
// `cd contracts && npx hardhat compile` if a new function is needed here.
export const AGENT_REGISTRY_ABI = [
  {
    type: "function",
    name: "mintAgent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "metadataHash", type: "bytes32" },
      { name: "encryptedURI", type: "string" },
      { name: "attestor", type: "address" },
      { name: "trustListRoot", type: "bytes32" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "event",
    name: "AgentMinted",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "metadataHash", type: "bytes32", indexed: false },
      { name: "encryptedURI", type: "string", indexed: false },
      { name: "attestor", type: "address", indexed: false },
      { name: "trustListRoot", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "error",
    name: "InvalidMetadataHash",
    inputs: [],
  },
] as const satisfies Abi;
