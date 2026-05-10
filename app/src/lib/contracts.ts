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

// CompassHub: minimal surface for browser-side grant signing + server-side
// consumeGrantAndIssueReceipt relay. Full ABI lives in
// contracts/typechain-types/contracts/CompassHub.ts.
export const COMPASS_HUB_ABI = [
  {
    type: "function",
    name: "consumeGrantAndIssueReceipt",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "g",
        type: "tuple",
        components: [
          { name: "agentTokenId", type: "uint256" },
          { name: "policyId", type: "bytes32" },
          { name: "provider", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "expiry", type: "uint64" },
          { name: "nullifier", type: "bytes32" },
        ],
      },
      { name: "sig", type: "bytes" },
      {
        name: "r",
        type: "tuple",
        components: [
          { name: "receiptId", type: "bytes32" },
          { name: "resultHash", type: "bytes32" },
          { name: "receiptExpiry", type: "uint64" },
          { name: "attestationDigest", type: "bytes32" },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "policies",
    stateMutability: "view",
    inputs: [{ name: "policyId", type: "bytes32" }],
    outputs: [
      { name: "policyHash", type: "bytes32" },
      { name: "admin", type: "address" },
      { name: "minAnonymitySet", type: "uint32" },
      { name: "active", type: "bool" },
      { name: "uri", type: "string" },
    ],
  },
  {
    type: "function",
    name: "registerPolicy",
    stateMutability: "nonpayable",
    inputs: [
      { name: "policyId", type: "bytes32" },
      { name: "policyHash", type: "bytes32" },
      { name: "uri", type: "string" },
      { name: "minAnonymitySet", type: "uint32" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "ReceiptIssued",
    inputs: [
      { name: "receiptId", type: "bytes32", indexed: true },
      { name: "policyId", type: "bytes32", indexed: true },
      { name: "nullifier", type: "bytes32", indexed: true },
      { name: "agentIdCommitment", type: "bytes32", indexed: false },
      { name: "resultHash", type: "bytes32", indexed: false },
      { name: "expiry", type: "uint64", indexed: false },
      { name: "attestationDigest", type: "bytes32", indexed: false },
      { name: "timestampBucket", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "GrantConsumed",
    inputs: [
      { name: "nullifier", type: "bytes32", indexed: true },
      { name: "policyId", type: "bytes32", indexed: true },
      { name: "provider", type: "address", indexed: true },
      { name: "agentIdCommitment", type: "bytes32", indexed: false },
    ],
  },
] as const satisfies Abi;

// EIP-712 domain matches CompassHub's `EIP712("Compass", "1")` constructor.
// chainId + verifyingContract are filled in at the call site (depends on
// active network — Galileo vs Aristotle).
export const COMPASS_EIP712_DOMAIN_NAME = "Compass";
export const COMPASS_EIP712_DOMAIN_VERSION = "1";

export const COMPASS_GRANT_TYPES = {
  Grant: [
    { name: "agentTokenId", type: "uint256" },
    { name: "policyId", type: "bytes32" },
    { name: "provider", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "expiry", type: "uint64" },
    { name: "nullifier", type: "bytes32" },
  ],
} as const;

// HELP for Domestic Workers — legal aid policy. policyId is keccak256 of the
// canonical UTF-8 string; matches contracts/test/CompassHub.authwit.t.ts.
export const HELP_LEGAL_AID_POLICY_LABEL = "help-legal-aid";
