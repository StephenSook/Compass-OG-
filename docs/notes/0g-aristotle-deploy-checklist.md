# 0G Aristotle Mainnet Deploy Checklist (A.5)

Once OG mainnet funding lands on the deployer wallet, A.5 is a one-shot
sequence. Keep it under 30 minutes by following this checklist top-to-bottom.

**Pre-deploy state assumed:**
- `0x05b5Bb550eb8401fC4b8a33bf566C03f49ef5d34` (deployer) holds ≥ 0.2 OG
  on Aristotle mainnet (chainId 16661).
- `contracts/.env` has `DEPLOYER_PRIVATE_KEY` populated (already true).
- All A.1–A.4 work has shipped on Galileo and is verified.

---

## 1. Confirm deployer balance on Aristotle

```bash
node -e "
const { ethers } = require('ethers');
(async () => {
  const p = new ethers.JsonRpcProvider('https://evmrpc.0g.ai');
  const bal = await p.getBalance('0x05b5Bb550eb8401fC4b8a33bf566C03f49ef5d34');
  console.log('Aristotle balance:', ethers.formatEther(bal), 'OG');
})();
"
```

Expect ≥ 0.2 OG. If less, top up via one of the paths in
`0g-mainnet-funding-options.md` before continuing.

---

## 2. Deploy AgentRegistry + CompassHub via the existing script

The deploy script (`contracts/scripts/deploy/deploy.ts`) is network-generic.
Hardhat's `--network og_aristotle` selects the Aristotle config from
`contracts/hardhat.config.ts` (already wired).

```bash
cd contracts
npx hardhat run scripts/deploy/deploy.ts --network og_aristotle
```

Outputs `docs/deployments/og_aristotle.json` with both addresses.
Commit the manifest:

```bash
git add docs/deployments/og_aristotle.json
git commit -m "chore(deploy): AgentRegistry + CompassHub on 0G Aristotle mainnet"
```

---

## 3. Fund the provider relayer wallet on Aristotle

Same fresh secp256k1 used on Galileo (`0xaD736a7233847Cf1D73a7D820b32424CF8125b0a`).
Top up with 0.05 OG so /api/consume can pay gas for `consumeGrantAndIssueReceipt`.

```bash
node -e "
const { ethers } = require('ethers');
(async () => {
  const p = new ethers.JsonRpcProvider('https://evmrpc.0g.ai');
  const w = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, p);
  const tx = await w.sendTransaction({
    to: '0xaD736a7233847Cf1D73a7D820b32424CF8125b0a',
    value: ethers.parseEther('0.05'),
  });
  console.log('Fund tx:', tx.hash);
  await tx.wait();
})();
"
```

---

## 4. Register HELP policy on the new Aristotle CompassHub

Same script as Galileo, pointed at the new contract. The script reads the
hub address from a CLI arg or env var — pass the Aristotle address:

```bash
node -e "
const { ethers } = require('ethers');
const HUB = process.env.HUB; // paste from og_aristotle.json
(async () => {
  const p = new ethers.JsonRpcProvider('https://evmrpc.0g.ai');
  const w = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, p);
  const ABI = ['function registerPolicy(bytes32, bytes32, string, uint32)'];
  const c = new ethers.Contract(HUB, ABI, w);
  const policyId = ethers.keccak256(ethers.toUtf8Bytes('help-legal-aid'));
  const policyHash = ethers.keccak256(ethers.toUtf8Bytes('help-canonical-policy-v1'));
  const tx = await c.registerPolicy(policyId, policyHash, 'https://compass.0g.ai/policies/help-legal-aid.json', 100);
  console.log('Register tx:', tx.hash);
  await tx.wait();
})();
"
```

Save the tx hash to `docs/notes/0g-aristotle-policy-setup.md` (mirror of
the Galileo version).

---

## 5. Fill in addresses in `app/src/lib/contracts.ts`

Replace the zero placeholders:

```ts
export const AGENT_REGISTRY_ARISTOTLE: Address = "0x..."; // from og_aristotle.json
export const COMPASS_HUB_ARISTOTLE: Address = "0x...";    // from og_aristotle.json
```

`activeAgentRegistry()` + `activeCompassHub()` will now return the new
addresses when `useMainnet()` is true.

---

## 6. Refactor live-call sites to use the chain selector

Currently `MintAgentButton`, `RequestEligibilityButton`, `/api/consume`,
and the `IssueCredentialButton`'s downstream all hard-reference
`zeroGGalileoTestnet` / `COMPASS_HUB_GALILEO`. Swap each for
`activeChain()` / `activeCompassHub()` / `activeAgentRegistry()`.

Keep this in a single PR titled `feat(network): chain selector wired to
mainnet flag`. Test on Galileo first (with the flag unset) to confirm zero
behavior change. Then flip the flag locally to confirm mainnet path.

---

## 7. Set `NEXT_PUBLIC_COMPASS_USE_MAINNET=1` in Vercel

```bash
cd app
printf 1 | vercel env add NEXT_PUBLIC_COMPASS_USE_MAINNET production
vercel --prod --yes
```

Local `app/.env` can stay on Galileo so dev work doesn't pay mainnet gas.

---

## 8. Smoke test the full E2E flow against mainnet

Per the demo-passes definition in the master plan:

1. Connect Privy → embedded wallet on chainId 16661
2. Mint agent → tx visible on https://chainscan.0g.ai
3. Issue credential → /api/issue still server-only, no chain switch
4. Encrypt + persist → browser-side, no chain
5. Request HELP eligibility → /api/consume calls Aristotle CompassHub →
   ReceiptIssued event on chainscan
6. Verify with `npm run verify-receipt -- --receiptId 0x...` against the
   Aristotle event

Three full cycles before declaring deploy-shipped (per project plan
"Phase 8" verification gate).

---

## 9. Update README + reality table

- README: contract addresses table, Aristotle Explorer links, demo tx hash
- /about reality table: flip "Aristotle mainnet deploy" row from `draft` to
  `real`; remove any "Galileo only" caveats from related rows

---

## Rollback path

If anything breaks at step 6+:
- Set `NEXT_PUBLIC_COMPASS_USE_MAINNET=0` in Vercel
- `vercel --prod --yes` to redeploy
- Demo falls back to Galileo

The mainnet contracts stay deployed (gas already spent); only the frontend
toggle moves. No on-chain rollback needed.
