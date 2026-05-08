# Privy embedded wallet — flip-on guide

The Compass frontend is wired for Privy embedded wallets but ships in fixture mode by default. Flip it on by setting one env var and redeploying. Total time: ~5 minutes once you have a Privy account.

## What changes when you flip it

| Surface | Fixture mode | Privy mode |
|---|---|---|
| `/onboard` Step 1 | "Connect" button → 800ms simulated timer → ✓ done | "Connect" button → opens Privy modal → email/Google/wallet login → embedded EVM wallet provisioned → ✓ {0x1234…abcd} |
| Step 1 detail copy | "Privy embedded wallet. Fixture here." | "Privy embedded wallet. Email or Google login provisions a secp256k1 key on this device." (or shows the address once connected) |
| Steps 2–3 | Unchanged (still fixture timers) | Unchanged (still fixture timers — full mint/issue wiring is on the v2 roadmap) |
| `/about` reality table | Privy row reads "wired in /onboard step 1; live when NEXT_PUBLIC_PRIVY_APP_ID is set, fixture timer otherwise" | Same row, but now it is honestly *live* |

The architecture diagram on `/about` and the layered SVG (`ArchitectureDiagram.tsx`) are unchanged; they describe the integration neutrally.

## Steps

1. **Create a Privy app.** Go to <https://dashboard.privy.io>, sign in, create a new app. Pick "Web" platform.
2. **Configure the chain.** In the app's *Networks* tab, add a custom EVM chain:
   - Name: `0G Galileo Testnet`
   - Chain ID: `16602`
   - RPC URL: `https://evmrpc-testnet.0g.ai`
   - Block explorer: `https://chainscan-galileo.0g.ai`
   - Currency symbol: `OG`
3. **Configure login methods.** Enable at least Email + Google. Optionally Wallet, Passkey, etc.
4. **Configure embedded wallets.** Under *Embedded Wallets*, enable:
   - "Create on login: users without wallets" (so first-time users get an EVM wallet auto-provisioned)
   - Default chain: 0G Galileo Testnet
5. **Copy the App ID.** It looks like `clxxxxxxxxxxxxxxxxxxxxxxx`. Paste into `app/.env`:
   ```
   NEXT_PUBLIC_PRIVY_APP_ID=clxxxxxxxxxxxxxxxxxxxxxxx
   ```
   (`NEXT_PUBLIC_*` variables are inlined at build time; the value ships in the client bundle, which is intentional and safe — Privy public app IDs are not secrets.)
6. **Configure allowed origins.** In Privy *Settings → Domains*, add your local origin (`http://localhost:3000`) and your production Vercel domain (`https://your-app.vercel.app`). Without this Privy refuses to mount.
7. **Rebuild and redeploy.** `npm run build && npm run start` locally; `vercel --prod` for production. The page picks up the new env var on next request.

## How the code reads it

- `app/src/lib/chains.ts` exposes `PRIVY_APP_ID` (`string | null`, read once at module load — `null` when the env var is unset or empty) and `isPrivyEnabled()` (returns `PRIVY_APP_ID !== null`).
- `app/src/components/providers/PrivyClientProvider.tsx` is the root client wrapper. When `PRIVY_APP_ID === null` it renders children directly with no Privy context. Otherwise it mounts `<PrivyProvider>` with the 0G Galileo testnet chain and the embedded-wallet config from step 4.
- `app/src/components/onboard/PrivyConnectButton.tsx` is the step 1 action. It calls `useLogin({onError})`, `usePrivy()`, `useWallets()` + `getEmbeddedConnectedWallet(wallets)` (so a connected MetaMask doesn't shadow the embedded wallet), gates `onConnected` on a `hasStarted` flag (no auto-advance for warm sessions), and times out provisioning at 30s. Once `authenticated && address`, it calls back to the parent page's `handlePrivyConnected` which marks step 1 done.
- `app/src/app/onboard/page.tsx` reads `isPrivyEnabled()` once and passes the Privy button to step 1 via `actionOverride` when true. When false, the original fixture button + 800ms timer takes over.

## How to verify it's live

After deploy, open `/onboard` in a fresh browser:

1. **Privy off** → Step 1 says "Privy embedded wallet. Fixture here. The wallet's secp256k1 key signs every consent." and the button shows "Connect" → click → 800ms wait → "✓ done".
2. **Privy on** → Step 1 says "Privy embedded wallet. Email or Google login provisions a secp256k1 key on this device. The same key signs every consent." and the button shows "Connect" → click opens Privy modal → log in → button shows "✓ 0x1234…abcd". The detail line then updates to include the live address.

The `/about` reality table is the canonical place to mention which mode is live in production. It currently reads honestly: live when set, fixture otherwise. Don't overclaim.

## What is *not* live yet

- Step 2 (mint the agent) — still fixture; uses a hard-coded prior Galileo mint tx hash. Real mint requires `AgentRegistry.mintAgent` wired to Privy's signer.
- Step 3 (issue demo credential) — still fixture; the issuer flow runs in the enclave-side mint script today, not the browser.
- The receipt-signer flow on `/clinic/subpoena` and `/receipt/[id]` — already real on the enclave side (Phala TDX, dstack-derived signer); browser-side wallet integration is independent.

These three pieces are what the v2 roadmap addresses. Privy turning on is the precondition for Step 2 and Step 3 to become real, but they don't auto-flip — they each need their own contract wiring.
