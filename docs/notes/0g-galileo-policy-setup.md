# Galileo policy + provider setup (A.3 wiring)

One-time setup ran on 2026-05-10 to unblock A.3 (live `consumeGrantAndIssueReceipt` from `/onboard`).

## HELP for Domestic Workers — legal aid policy

Registered on `0x60BbE5fcA6D23f7d25142E721258c641b45A7c3b` (Galileo CompassHub).

| Field             | Value                                                                |
|-------------------|----------------------------------------------------------------------|
| `policyId`        | `0x21b8b0e65ae28bfbae2096e8a9b7bc245d92d5e56fb74ca989c1a551b4c2d08f` |
| label             | `keccak256("help-legal-aid")`                                        |
| `policyHash`      | `keccak256("help-canonical-policy-v1")`                              |
| URI               | `https://compass.0g.ai/policies/help-legal-aid.json`                 |
| `minAnonymitySet` | `100`                                                                |
| admin             | deployer `0x05b5Bb550eb8401fC4b8a33bf566C03f49ef5d34`                |

Register tx: <https://chainscan-galileo.0g.ai/tx/0xc028a63f4a70a9103fd8f27375c7b7165db57d4a321f1c4cfaedee7f4b8f96d4>

## Provider relayer wallet

Fresh secp256k1 generated client-side; private key lives only in `app/.env`
and Vercel `PROVIDER_PRIVATE_KEY` (production scope).

| Field   | Value                                       |
|---------|---------------------------------------------|
| address | `0xaD736a7233847Cf1D73a7D820b32424CF8125b0a` |

Funded `0.1 OG` from deployer for Galileo gas. Top-up tx:
<https://chainscan-galileo.0g.ai/tx/0x6c948980574f24b2fcba08dc697aafa3789c31a28cfb04d690f38420a9556546>

If the provider drops below ~0.01 OG (each `consumeGrantAndIssueReceipt`
costs ~140k gas), top up via:

```
node -e "const e=require('ethers');const p=new e.JsonRpcProvider('https://evmrpc-testnet.0g.ai');const w=new e.Wallet(process.env.DEPLOYER_PRIVATE_KEY,p);w.sendTransaction({to:'0xaD736a7233847Cf1D73a7D820b32424CF8125b0a',value:e.parseEther('0.1')}).then(t=>console.log(t.hash))"
```

## Honest limits — provider key model

- v1 uses one provider key for all simulated NGOs (HELP, Bethune, Hospital).
  In production each NGO holds its own key in their own enclave.
- Provider key is co-mingled in `app/.env` rather than the Phala enclave that
  signs receipts. v2 moves it into the same TEE that produces RA quotes
  (so the on-chain `provider` becomes a TEE-attested address).
- The fresh provider key is unrelated to the deployer; only the funding
  bridge connects them.
