# Phala Cloud Deployment Evidence

> _Skeleton — overwritten by `enclave/phala/scripts/verify-deploy.ts` after the live deploy. Do not hand-edit values below until a verify-deploy run replaces this file._

## Live deployment

- **Base URL:** _pending deploy_
- **/health:** _pending_
- **Bound at:** _pending_

## Attestation chain

| Field | Value |
|---|---|
| ethAddress | _pending_ |
| composeHash | _pending_ |
| appId | _pending_ |
| instanceId | _pending_ |
| reportDataHex | _pending_ |
| signatureChain entries | _pending_ |
| quoteHex length | _pending_ |

## Verification

`verifyReportDataBinding` will be run against this quote post-deploy. A green
run proves the receipt signing key was derived inside the TDX-attested image
whose compose hash matches the value above.

## How to populate this file

```bash
cd enclave
npx ts-node phala/scripts/verify-deploy.ts https://<cvm-id>.phala.network
```

See `enclave/phala/deploy.md` for the full runbook.
