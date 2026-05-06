/**
 * Phase 1.10 prerequisite — generate a fresh testnet wallet for the broker smoke test.
 *
 * Run once: `npx ts-node src/generate-wallet.ts`
 *
 * Prints address + private key. Save to ../.env as DEPLOYER_PRIVATE_KEY.
 * Then visit the 0G Galileo faucet to fund: https://faucet.0g.ai/
 *
 * NEVER commit the printed private key. The .env file is gitignored.
 */
import { Wallet } from "ethers";

const wallet = Wallet.createRandom();
console.log("=".repeat(60));
console.log("FRESH TESTNET WALLET GENERATED");
console.log("=".repeat(60));
console.log(`Address:     ${wallet.address}`);
console.log(`Private Key: ${wallet.privateKey}`);
console.log(`Mnemonic:    ${wallet.mnemonic?.phrase ?? "(none)"}`);
console.log("=".repeat(60));
console.log("");
console.log("NEXT STEPS:");
console.log(`1. Add to ../.env:  DEPLOYER_PRIVATE_KEY=${wallet.privateKey}`);
console.log(`2. Visit faucet:    https://faucet.0g.ai/`);
console.log(`3. Paste address:   ${wallet.address}`);
console.log(`4. Wait for funded confirmation (~30 sec)`);
console.log(`5. Run smoke test:  npx ts-node src/smoke-test.ts`);
console.log("");
console.log("WARNING: This is a TESTNET wallet. Do NOT use for mainnet without re-checking.");
