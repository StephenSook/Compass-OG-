import Link from "next/link";
import { LiquidGlass } from "@/components/primitives/LiquidGlass";

type QA = { q: string; a: React.ReactNode };

const FAQ_TECHNICAL: QA[] = [
  {
    q: "Is this just a zk-proof? Why a TEE?",
    a: (
      <>
        <p>
          No — Compass v1 uses SD-JWT VC selective disclosure plus a sealed
          Phala dstack TDX receipt-signer. The TEE evaluates the policy
          predicate against the disclosed claims. The on-chain commitment
          binds an attestation digest sourced from a per-receipt RA quote.
        </p>
        <p className="mt-3">
          The trade-off vs ZK is documented in{" "}
          <Link href="https://github.com/StephenSook/Compass-OG-/blob/main/docs/zk-future-work.md" className="underline">
            docs/zk-future-work.md
          </Link>
          . Short version: ZK removes the TEE trust assumption but costs
          ~5-30s of in-browser proving and a per-policy circuit. Compass'
          threat model — abusive employer with subpoena power — is well-fit
          to the TEE path's sub-second receipt mint. A v2 dual-path is on
          the roadmap.
        </p>
      </>
    ),
  },
  {
    q: "What does a subpoena actually receive?",
    a: (
      <>
        <p>
          A 15-minute timestamp bucket and a cryptographic commitment to
          the user's on-chain agent identity. Specifically, the
          <span className="font-mono"> ReceiptIssued </span>event fields:
          <span className="font-mono"> receiptId · policyId · nullifier ·
          agentIdCommitment · resultHash · attestationDigest ·
          timestampBucket · expiry</span>.
        </p>
        <p className="mt-3">
          What it does NOT receive: name, HKID, employer, visa status, date
          of birth, document scans, anything in the SD-JWT VC. The vault
          stays encrypted in the user's browser with a non-extractable
          WebCrypto key.
        </p>
        <p className="mt-3">
          See{" "}
          <Link href="/clinic/subpoena" className="underline">
            the subpoena scene
          </Link>{" "}
          for the live render of what gets disclosed.
        </p>
      </>
    ),
  },
  {
    q: "Can the receipt-signer be coerced?",
    a: (
      <>
        <p>
          The signing key is derived inside the TDX enclave from{" "}
          <span className="font-mono">dstack.getKey('compass-receipt-signer')</span>{" "}
          — it's deterministically sealed to the MR_TD of the attested
          image. The key never leaves the enclave; the only way to obtain
          it is to compromise TDX itself or coerce Intel.
        </p>
        <p className="mt-3">
          Per-receipt RA quotes bind{" "}
          <span className="font-mono">(signer, image, receiptId)</span> so
          even an archived quote cannot be replayed across deployments.
        </p>
        <p className="mt-3">
          That's strong against employer-level adversaries; weaker against
          nation-state-level adversaries with TDX zero-day capability. We
          name this trade-off in{" "}
          <Link href="https://github.com/StephenSook/Compass-OG-/blob/main/docs/honest-limits.md" className="underline">
            docs/honest-limits.md
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    q: "How do I verify a receipt myself?",
    a: (
      <>
        <p>
          Clone the repo and run the bundled verifier:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-border/40 bg-card/40 p-4 font-mono text-xs text-muted-foreground">
{`git clone https://github.com/StephenSook/Compass-OG-.git
cd Compass-OG-/enclave
npm install
npm run verify-receipt -- --bundle ./fixtures/sample-receipt.json`}
        </pre>
        <p className="mt-3">
          The verifier re-derives the entire cryptographic chain locally:
          signer recovery, quote freshness check, image binding check,
          attestation digest derivation. No remote calls needed once the
          bundle is on disk.
        </p>
      </>
    ),
  },
  {
    q: "Why is the frontend defaulting to Galileo when contracts live on Aristotle mainnet?",
    a: (
      <>
        <p>
          The frontend reads{" "}
          <span className="font-mono">NEXT_PUBLIC_COMPASS_USE_MAINNET</span>
          {" "}— unset means Galileo testnet (safer for casual exploration),
          set to <span className="font-mono">1</span> switches to
          Aristotle mainnet. The mainnet contracts are deployed and
          accepting receipts; the flip happens before recording the demo
          video so judges can watch real mainnet receipts mint live.
        </p>
        <p className="mt-3">
          See the <Link href="/about" className="underline">reality table on /about</Link>{" "}
          for the canonical state of which rows are real vs draft.
        </p>
      </>
    ),
  },
  {
    q: "What's stopping me from spamming /api/consume?",
    a: (
      <>
        <p>
          Two things. First, a sliding-window rate limit (5 req/min per
          client IP) at the route boundary —{" "}
          <span className="font-mono">app/src/lib/ratelimit.ts</span>.
          Second, the contract requires a valid EIP-712 grant signed by an
          existing agent owner, so a flood requires minting agent NFTs
          first (which costs the attacker gas).
        </p>
        <p className="mt-3">
          The rate-limit is in-memory and stateless across Vercel cold
          starts — adequate for the hackathon window, but{" "}
          <span className="font-mono">Vercel KV / Upstash Redis</span> is
          the v2 fix. Documented in the module header.
        </p>
      </>
    ),
  },
];

const FAQ_HUMAN: QA[] = [
  {
    q: "Who is Compass for?",
    a: (
      <>
        <p>
          Primary users: vulnerable migrant workers in Hong Kong — Foreign
          Domestic Helpers, agricultural workers, garment workers — who
          need to prove eligibility for free legal aid, shelter access, or
          public hospital care without disclosing their identity to a
          system their employer may later subpoena.
        </p>
        <p className="mt-3">
          Secondary users: the NGO intake clinicians who today operate
          paper-form intake and would benefit from a drop-in kiosk that
          turns receipt-not-identity into the default. See{" "}
          <Link href="/kiosk" className="underline">the kiosk mode</Link>.
        </p>
      </>
    ),
  },
  {
    q: "Is this real, or a demo?",
    a: (
      <>
        <p>
          It's a working hackathon submission. Contracts are deployed and
          accepting receipts on both Aristotle mainnet (chainId 16661) and
          Galileo testnet (chainId 16602). The Phala dstack TDX enclave is
          live and signing receipts with a key sealed to its attested
          image. Browser-side encryption is real — non-extractable
          WebCrypto in IndexedDB. SD-JWT VC issuance is real Ed25519.
        </p>
        <p className="mt-3">
          The persona narrative (Maria, the domestic worker) is a
          composite. Real NGO partnerships are pending — six outreach
          drafts are queued in{" "}
          <span className="font-mono">docs/outreach/</span>.
        </p>
        <p className="mt-3">
          Honest reality table:{" "}
          <Link href="/about" className="underline">/about</Link>.
        </p>
      </>
    ),
  },
  {
    q: "What's stopping an abusive employer from forcing the worker to reveal her credential anyway?",
    a: (
      <>
        <p>
          Nothing technical. Compass narrows the disclosure surface but
          cannot defeat coercion under direct duress — if the employer
          watches the worker's screen at the moment of disclosure, the
          plaintext VC is visible before encryption.
        </p>
        <p className="mt-3">
          Compass' threat model is the asynchronous subpoena, not the
          face-to-face coercion. A worker who has already left the abusive
          situation and is using a clinic kiosk in a safe space gets the
          full guarantee. A worker under active surveillance does not. We
          name this in{" "}
          <Link href="https://github.com/StephenSook/Compass-OG-/blob/main/docs/honest-limits.md" className="underline">
            docs/honest-limits.md
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    q: "Why these specific NGOs?",
    a: (
      <>
        <p>
          HELP for Domestic Workers, Bethune House Migrant Women's Refuge,
          and Mission for Migrant Workers are three of the most active
          frontline organisations supporting Foreign Domestic Helpers in
          Hong Kong. The Hospital Authority is the public-hospital
          provider whose free-care eligibility is gated on visa status.
        </p>
        <p className="mt-3">
          The demo policies match real services these organisations
          provide. Real partnerships are not yet established; persona
          narrative is inspired by their work but does not represent any
          real client of theirs.
        </p>
      </>
    ),
  },
  {
    q: "Can I use Compass for something other than migrant workers?",
    a: (
      <>
        <p>
          Architecturally, yes — the receipt-signer is policy-agnostic.
          Any eligibility predicate that can be evaluated against
          SD-JWT VC claims fits the same flow: refugee assistance
          eligibility, food bank eligibility, anonymous job-seeker
          eligibility, anonymous survivor-of-violence service eligibility,
          academic financial-aid eligibility.
        </p>
        <p className="mt-3">
          Compass v1 is specialised to the migrant-worker context because
          the threat model is sharpest there. If you want to fork for
          another use case, the contract surface is ~250 LoC and the
          policy hash is a public input — open an issue tagged{" "}
          <span className="font-mono">use-case-fork</span> and we can talk
          scope.
        </p>
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <header className="fixed top-6 left-1/2 z-50 -translate-x-1/2">
        <LiquidGlass radius="full" className="px-6 py-2">
          <Link
            href="/"
            className="font-mono text-xs tracking-[0.3em] text-foreground uppercase"
          >
            ← COMPASS
          </Link>
        </LiquidGlass>
      </header>

      <section className="flex flex-1 flex-col items-center px-6 pt-32 pb-24">
        <div className="w-full max-w-4xl">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
            Frequently Asked Questions
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-medium text-foreground md:text-6xl">
            <span className="font-serif italic">Honest</span> answers,
            with citations.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Pulled from the questions judges, builders, and reporters have
            asked first. Every answer links the file that ships the
            evidence — no marketing claims that aren't backed by code or
            a documented limit.
          </p>

          <div className="mt-16">
            <h2 className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
              Technical
            </h2>
            <div className="mt-6 space-y-12">
              {FAQ_TECHNICAL.map((qa, i) => (
                <FaqRow key={i} qa={qa} />
              ))}
            </div>
          </div>

          <div className="mt-20">
            <h2 className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
              Human / non-technical
            </h2>
            <div className="mt-6 space-y-12">
              {FAQ_HUMAN.map((qa, i) => (
                <FaqRow key={i} qa={qa} />
              ))}
            </div>
          </div>

          <div className="mt-20 flex flex-wrap gap-4">
            <Link
              href="/about"
              className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              Architecture & reality table →
            </Link>
            <Link
              href="/roadmap"
              className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              Roadmap →
            </Link>
            <Link
              href="https://github.com/StephenSook/Compass-OG-"
              className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              Repo →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function FaqRow({ qa }: { qa: QA }) {
  return (
    <div>
      <h3 className="text-xl font-medium text-foreground md:text-2xl">
        {qa.q}
      </h3>
      <div className="mt-3 max-w-3xl text-base text-muted-foreground">
        {qa.a}
      </div>
    </div>
  );
}
