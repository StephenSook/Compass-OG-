# Phala Cloud deploy runbook

End-to-end steps to put the Compass receipt-signer inside an Intel TDX CVM on Phala Cloud and capture the cryptographic evidence the README will pin.

## Pre-flight

- `enclave/phala/Dockerfile` builds canonical `enclave/src/server.ts` (single-codebase dual-boot — no phala/src duplication).
- `enclave/phala/docker-compose.yaml` mounts `/var/run/dstack.sock` and sets `COMPASS_BIND_HOST=0.0.0.0`.
- Server boots in TEE mode by default (refuses to fall back to env-var keys without explicit `COMPASS_FORCE_LOCAL=1`).
- All 88 vitest tests green; tsc clean.

## Step 1 — Phala Cloud account

1. `https://cloud.phala.com/register` — GitHub / Google / email.
2. Free credits cover the first CVM (~$5–10 of TDX time). Confirm credits show on dashboard.

## Step 2 — Deploy the CVM

1. Dashboard → **CVMs** → **New CVM**
2. **Image source:** _Build from Compose_
3. Upload `enclave/phala/docker-compose.yaml`. Docker context is `enclave/`, so the build uploads only the `enclave/` tree (Phala builds the image from your Dockerfile in their builder).
4. **Resources:** smallest TDX SKU (1 vCPU, 1 GiB) — receipt signing has minimal compute needs.
5. **Network:** expose port `8080`. Phala assigns an HTTPS URL of the form `https://<cvm-id>.phala.network`.
6. **Encrypted env:** leave `COMPASS_*` env empty. The signer key is derived inside the enclave; passing one is a misconfiguration that triggers strict-parse failure at boot.
7. **Deploy.** First boot takes ~3–5 minutes (image pull + dstack handshake).

## Step 3 — Capture compose hash

Phala dashboard exposes the compose hash under **CVM → Details → Image manifest**. Copy it. The same value will be returned by the running container at `GET /v1/attestation` under `composeHash` — they MUST match.

## Step 4 — Verify the deployment

From repo root:

```bash
cd enclave
npx ts-node phala/scripts/verify-deploy.ts https://<cvm-id>.phala.network
```

The script:
1. Hits `/health`, asserts `source: "tee"`.
2. Hits `/v1/attestation`, fetches `quoteHex` + `ethAddress` + `composeHash` + `signatureChainHex`.
3. Calls `verifyReportDataBinding({quoteHex, expectedEthAddress, expectedComposeHash})` — throws `VerificationError` on any mismatch.
4. Writes a fresh `docs/notes/phala-deployment.md` capturing the live values.

A green run prints:

```
[verify-deploy] /health source=tee signer=0x...
[verify-deploy] ethAddress:    0x...
[verify-deploy] composeHash:   0x...
[verify-deploy] running verifyReportDataBinding...
[verify-deploy] OK — quote binds to (ethAddress, composeHash)
[verify-deploy] evidence written to docs/notes/phala-deployment.md
```

## Step 5 — Commit the evidence

```bash
git add docs/notes/phala-deployment.md
git commit -m "docs(deploy): pin live Phala TDX deployment evidence (TEE attestation OK)"
git push origin main
```

The values pinned here will be referenced from the top-level README and from the verify-receipt CLI as the canonical Compass deployment.

## Failure modes + handling

| Symptom | Cause | Fix |
|---|---|---|
| `/health` returns `source: "env"` | dstack.sock didn't mount, server fell back to env (only possible if `COMPASS_FORCE_LOCAL=1` got set somewhere) | Inspect Phala CVM env, remove `COMPASS_FORCE_LOCAL`; restart |
| `/v1/attestation` 404 with `E_NO_ATTESTATION` | TEE mode not active | Same as above |
| `verifyReportDataBinding` throws `QUOTE_VERSION_UNSUPPORTED` | Phala emits TDX v5 quotes; current verifier hard-codes v4 offset | Capture `quoteHex` bytes 0–4, calibrate v5 offset, update `verify-attestation.ts` (Phase 6 Day-7 work) |
| `verifyReportDataBinding` throws `REPORT_DATA_MISMATCH` | dstack v0.5 + getQuote semantics changed (auto-hashing came back, padding semantics shifted) | Inspect raw 64 bytes of report_data; reconcile against current SDK source at `node_modules/@phala/dstack-sdk/dist/node/index.js` |
| `npm ci` build fails inside Phala builder | Phala's Node 22 toolchain rejects `--legacy-peer-deps` | Pin SDK and remove the flag (peer-dep clash needs to be resolved upstream) |

## Open questions for Phala TG / Discord

1. Free-credit tier long-running CVM ceiling (24+ hr)?
2. Canonical TDX QVL flow — DStack Verifier binary, Trust Center API, or self-hosted Intel QVL?
3. Does the dashboard `composeHash` always match dstack `info().compose_hash` exactly?
4. Are emitted quotes TDX v4 or v5? (Affects current verifier offset.)
