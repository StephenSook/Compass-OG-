# Sentry error tracking — setup

Catching production errors during the demo window (and post-launch) is
high-leverage: a single unobserved 500 at the moment a judge clicks a
flow can cost a prize ranking. Sentry's free tier (5k events / month,
1 project) is more than enough for the Compass scale.

## Status

Scaffolded but **not active** — Sentry SDK is install-gated. The site
runs identically with or without Sentry; nothing is broken by leaving
this off.

## Activate in 5 minutes

1. Create a Sentry account at https://sentry.io/signup/ (free tier
   needs no card).
2. Create a project: **Platform = Next.js**, name `compass-app`.
3. Copy the DSN — looks like
   `https://abc...@o123.ingest.sentry.io/12345`.
4. Add the DSN as `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` to Vercel
   prod env:
   ```bash
   cd app
   vercel env add SENTRY_DSN production
   vercel env add NEXT_PUBLIC_SENTRY_DSN production
   ```
5. Install the SDK:
   ```bash
   cd app && npm install @sentry/nextjs
   ```
6. Run `npx @sentry/wizard@latest -i nextjs` from `app/` to generate
   the `sentry.client.config.ts`, `sentry.server.config.ts`,
   `sentry.edge.config.ts`, and `next.config.ts` wrapper. The wizard
   handles ~95% of the wiring.
7. Set sampling appropriately: `tracesSampleRate: 0.1` for production
   (10% of transactions), `replaysSessionSampleRate: 0`,
   `replaysOnErrorSampleRate: 1.0`. We do NOT enable session replay
   broadly — it can capture sensitive form data; only on error.
8. Re-deploy: `vercel --prod --yes`.
9. Verify by visiting `https://app-psi-pied.vercel.app/api/error` (you
   can add a temporary route that throws). The error lands in Sentry's
   "Issues" tab within ~30s.

## What to monitor first

After activation, set up alerts in Sentry → Alerts → Rules:

- `error.level >= warning` on `/api/consume` — this is where signed
  grants get rejected. A spike here = on-chain regression.
- `error.level >= error` on any route during the BEYOND Expo demo
  window (May 28). Set a Telegram or email channel.
- `transaction.duration > 5s` on `/api/issue` — if SD-JWT signing
  hits Ed25519 entropy issues we'd see this here.

## Why not skip Sentry entirely

The honest reasoning: without Sentry, a flaky third-party Phala TEE or
Aristotle RPC hiccup at the wrong moment is invisible. The flow looks
broken to the judge, you have no diagnostic trail, and the
post-mortem requires reproducing locally. With Sentry, you see the
exact request shape that failed and can fix forward in minutes.

## What's left scaffolded but disabled

- The `next.config.ts` wrapper is NOT applied — only the security
  headers we added land in production. After the wizard runs you'll
  see a `withSentryConfig(...)` wrapper added; that's fine.
- No client-side error boundary is installed yet. After activation,
  consider adding a `app/src/components/SentryErrorBoundary.tsx` and
  wrapping `app/src/app/layout.tsx`.

## Privacy considerations

Compass is a privacy-preserving project. Two posture items:

1. **No PII in events.** The browser's Sentry SDK auto-captures the
   request URL, headers, and (by default) form-data. We must add a
   `beforeSend` hook that scrubs the `body` for any field matching
   `*credential*`, `*sdJwt*`, `*privateKey*`, `*hkid*`, `*name*`.
2. **No session replay by default.** `replaysSessionSampleRate: 0` is
   the right setting. Only on-error replay captures, and only for the
   30s window before the error — long enough for the stack-trace
   context, short enough to avoid recording full intake flows.

The scrubbing config:

```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event, hint) {
    // Scrub any request body fields that might contain sensitive data.
    if (event.request?.data && typeof event.request.data === "object") {
      const sensitive = /credential|sdJwt|privateKey|hkid|name|employer/i;
      for (const key of Object.keys(event.request.data)) {
        if (sensitive.test(key)) {
          (event.request.data as Record<string, unknown>)[key] = "[scrubbed]";
        }
      }
    }
    return event;
  },
});
```

Once active, run a single manual scrubbing-test deploy to confirm no
sensitive fields leak.
