import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import type { HardhatUserConfig } from "hardhat/config";

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? "";
const ZEROG_RPC_URL = process.env.ZEROG_RPC_URL ?? "https://evmrpc.0g.ai";
const ZEROG_TESTNET_RPC_URL =
  process.env.ZEROG_TESTNET_RPC_URL ?? "https://evmrpc-testnet.0g.ai";

const accounts = DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      viaIR: true,
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    og_galileo: {
      url: ZEROG_TESTNET_RPC_URL,
      chainId: 16602,
      accounts,
    },
    og_aristotle: {
      url: ZEROG_RPC_URL,
      chainId: 16661,
      accounts,
    },
  },
  etherscan: {
    apiKey: {
      og_galileo: "no-api-key-needed",
      og_aristotle: "no-api-key-needed",
    },
    customChains: [
      {
        network: "og_galileo",
        chainId: 16602,
        urls: {
          apiURL: "https://chainscan-galileo.0g.ai/api",
          browserURL: "https://chainscan-galileo.0g.ai",
        },
      },
      {
        network: "og_aristotle",
        chainId: 16661,
        urls: {
          apiURL: "https://chainscan.0g.ai/api",
          browserURL: "https://chainscan.0g.ai",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
