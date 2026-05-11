# Uptime monitor — setup

Five minutes of work for a high-confidence signal during the demo
window: an external pinger that alerts if `/api/tee-status` or
`/about` returns non-2xx.

## Choice: BetterStack (recommended) or UptimeRobot

| Tool | Free tier | Best for |
|---|---|---|
| BetterStack | 10 monitors, 3-min interval, public status page | Compass (3 monitors needed) |
| UptimeRobot | 50 monitors, 5-min interval, no public page | If you want a single account for many side-projects |

Either works. BetterStack's public status page is a nice signal for
judges who click around — they can see green checkmarks live. Below
assumes BetterStack.

## Setup

1. Create account at https://betterstack.com/uptime (no card needed
   for the free tier).
2. Add three monitors:

| Name | URL | Expected | Interval |
|---|---|---|---|
| Compass — Frontend | `https://app-psi-pied.vercel.app/` | 200 OK | 3 min |
| Compass — TEE probe | `https://app-psi-pied.vercel.app/api/tee-status` | 200 OK, body contains `"mode"` | 3 min |
| Compass — Aristotle RPC | `https://evmrpc.0g.ai/` (POST `{"jsonrpc":"2.0","method":"eth_blockNumber","id":1,"params":[]}`) | 200 OK, body contains `"result"` | 5 min |

3. Configure escalation:
   - First failure → Telegram message to `@stephensookra`
     (BetterStack's free Telegram integration).
   - Second failure (6 min) → Email to `stephensookra@gmail.com`.
   - Third failure (9 min) → SMS via Twilio if you have a Twilio
     account already; otherwise stop here, the Telegram + Email is
     enough for the demo window.
4. Public status page (optional but recommended):
   - Subdomain: `https://compass.betteruptime.com` (free) or
     `https://status.compass.0g.ai` if you set up a CNAME.
   - Embed the iframe in the project README footer.
5. Add the status-page URL to the press kit (`docs/press-kit.md`)
   and the Demo/script.md (if a judge asks "is it live?").

## During the BEYOND Expo demo

- Mute Telegram for the 2-hour demo window itself (you don't want a
  ping mid-demo causing a notification banner over your screen).
- Re-enable immediately after.

## Beyond the hackathon window

A status page becomes part of the project's trust surface. NGOs
considering integration will look for one. Cost stays $0 unless you
exceed 10 monitors.

## What this does NOT cover

- On-chain liveness of CompassHub (the contract itself doesn't 4xx;
  if Aristotle is healthy your transactions will go through). For
  finer signals, watch `ReceiptIssued` event count over time —
  `/audit` shows this once the live-events upgrade lands.
- The Phala CVM `mode: tee` vs `mode: stub` distinction — Capture
  this in the existing `/api/tee-status` route check (BetterStack can
  do `body contains "tee"` regex matching).
