# Compass on Phala dstack TDX

Single-codebase deployment for the Compass receipt-signer running inside Intel TDX. The same `enclave/src/server.ts` boots in two modes:

1. **TEE mode** — `/var/run/dstack.sock` present (Phala Cloud / local dstack-vmm). Receipt-signer key is derived inside the enclave via `dstack.getKey('compass-receipt-signer')` (deterministic secp256k1, sealed to MR_TD). The eth address is committed into the TDX quote's `report_data` field as `sha256(ethAddress || composeHash)`. Quote, composeHash, eth address, and signature chain are exposed via `/v1/attestation`.
2. **Dev mode** — env-var `COMPASS_RECEIPT_SIGNER_KEY`. Insecure; never deploy.

## Files

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage Node 22 alpine build of the canonical `enclave/src/server.ts` |
| `docker-compose.yaml` | Mounts `/var/run/dstack.sock`, sets `COMPASS_BIND_HOST=0.0.0.0` |
| `docker-compose.scout.yaml` | Image scanning compose for security pre-flight |
| `../src/dstack.ts` | Wrapper around `@phala/dstack-sdk`: `tryLoadAttestedSigner()` |
| `../src/verify-attestation.ts` | Consumer-side `verifyReportDataBinding({quoteHex, expectedEthAddress, expectedComposeHash})` |

## Verifier flow (consumer side)

```ts
import { verifyReportDataBinding } from "../src/verify-attestation";

const att = await fetch(`${enclaveUrl}/v1/attestation`).then(r => r.json());
const result = verifyReportDataBinding({
  quoteHex: att.quoteHex,
  expectedEthAddress: receipt.signerAddress,    // from receipt JSON
  expectedComposeHash: att.composeHash,         // pinned in repo / on-chain
});
if (!result.ok) throw new Error(result.reason);

// Then validate the receipt signature against att.ethAddress and run the
// full TDX quote signature chain via DStack Verifier or Intel QVL.
```

Combined chain proves: signing key was derived inside a TDX-measured image whose composeHash matches the published Compass deployment, AND the receipt was signed by that exact key.

## Deploy steps (Phala Cloud)

1. `https://cloud.phala.com/register` — free credits cover first CVM
2. From `enclave/`, build: `docker build -f phala/Dockerfile -t compass-enclave:local .`
3. Phala Cloud dashboard → CVM → New CVM → upload `phala/docker-compose.yaml`
4. Set encrypted env vars per docker-compose.yaml (no signer key — derived inside)
5. Deploy. Capture deployment URL + composeHash from dashboard
6. `curl https://<cvm>.phala.network/v1/attestation` — confirm `ethAddress`, `composeHash`, `quoteHex` returned
7. Pin composeHash + ethAddress in `docs/honest-limits.md` §5b and `docs/notes/phala-deployment.md`

## Open questions for Phala TG / Discord

1. Free-credit tier long-running CVMs (24+ hr)?
2. Canonical TDX Quote Verification flow — DStack Verifier binary, Trust Center API, or Intel QVL roll-your-own?
3. Does dstack `info().compose_hash` exactly match the Phala dashboard image hash?

## What still ties Compass to 0G

Even with Phala doing the TEE, 0G remains load-bearing:

- AgentRegistry + CompassHub deployed to Galileo
- 0G Storage encrypted vault uploads
- Optional 0G TeeML for "explain this receipt" UX (cosmetic)

Track 5 narrative: "0G Chain + 0G Storage + Phala TEE."
