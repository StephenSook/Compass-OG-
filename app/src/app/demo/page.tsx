import Link from "next/link";
import { LiquidGlass } from "@/components/primitives/LiquidGlass";

type Step = {
  number: string;
  title: string;
  href: string;
  what: string;
  whyItMatters: string;
  whatLandsOnChain: string;
};

const STEPS: Step[] = [
  {
    number: "01",
    title: "Open the subpoena scene first",
    href: "/clinic/subpoena",
    what: "A clinician produces what would be disclosed under a PDPO §57 subpoena.",
    whyItMatters:
      "Establishes the asymmetry we're attacking. The status quo would disclose name, HKID, employer, and document scans. Compass discloses a 15-minute bucket and a commitment. That's the whole pitch in 5 seconds.",
    whatLandsOnChain:
      "Nothing. This is a read-only view of a fixture receipt.",
  },
  {
    number: "02",
    title: "Onboard as Maria",
    href: "/onboard",
    what: "Four-step flow: connect Privy embedded wallet → mint a soulbound agent NFT → receive a fresh SD-JWT VC → request eligibility.",
    whyItMatters:
      "This is the full happy path. Each step is real on Galileo (or mainnet when NEXT_PUBLIC_COMPASS_USE_MAINNET=1). The SD-JWT VC is signed Ed25519 by the issuer route; the vault is AES-256-GCM with a non-extractable WebCrypto key; the grant is EIP-712 typed-data signed by the user's embedded wallet.",
    whatLandsOnChain:
      "Step 2 mints an INFT in AgentRegistry. Step 4 atomically consumes a single-use grant + emits a ReceiptIssued event in CompassHub, all in one tx.",
  },
  {
    number: "03",
    title: "Inspect the encrypted vault",
    href: "/vault",
    what: "See the credential ciphertext, the AES-GCM IV, and the metadata. Open DevTools → IndexedDB to confirm the decryption key is non-extractable.",
    whyItMatters:
      "Plaintext SD-JWT VC never enters localStorage. The WebCrypto key handle persists across page reloads but cannot be exported by any extension or script.",
    whatLandsOnChain:
      "Nothing. The vault lives client-side; the ciphertext upload to 0G Storage is the v2 path (currently behind COMPASS_LIVE_STORAGE=1).",
  },
  {
    number: "04",
    title: "Read the public audit log",
    href: "/audit",
    what: "The on-chain ReceiptIssued events with the non-identifying fields exposed.",
    whyItMatters:
      "This is what the world sees. policyId, nullifier, agentIdCommitment, resultHash, attestationDigest, timestampBucket. No row in this log lets you derive who the worker is.",
    whatLandsOnChain:
      "Already on-chain — this is just the read view. Each event ties back to a specific block on chainscan(-galileo).0g.ai.",
  },
  {
    number: "05",
    title: "Look at the 3D audit visualisation",
    href: "/audit-graph.html",
    what: "A force-graph rendering of the same audit log, clustered by 15-minute timestamp bucket. No inter-receipt edges — we cannot suggest correlation between disclosures.",
    whyItMatters:
      "Demonstrates that even an attacker with the full receipt graph cannot infer who interacted with whom. The unlinkability is a structural property of the data, not a UI choice.",
    whatLandsOnChain:
      "Nothing — read-only render.",
  },
  {
    number: "06",
    title: "Verify the chain yourself",
    href: "https://github.com/StephenSook/Compass-OG-#tutorial--verify-someone-elses-compass-receipt",
    what: "Clone the repo and run the verify-receipt CLI against a bundled fixture or a real on-chain receipt.",
    whyItMatters:
      "Don't trust the maintainer. Don't trust the website. Re-derive the cryptographic chain locally — signer recovery, quote freshness, image binding, attestation digest — from the receipt bundle alone.",
    whatLandsOnChain:
      "Nothing. This is the verifier path that closes the trust loop.",
  },
  {
    number: "07",
    title: "Read the reality table",
    href: "/about",
    what: "Every claim on the home page mapped to a row marked real / draft / mocked / stubbed.",
    whyItMatters:
      "Compass is honest about its limits. We do not hide draft rows behind happy-path screenshots. The trade-offs are itemised so a reader can decide for themselves whether the security claim holds for their threat model.",
    whatLandsOnChain:
      "Nothing — but the rows that say 'real' all link to the tx, commit, or live URL that backs them.",
  },
];

export default function DemoPage() {
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
            Guided demo · 7 stops
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-medium text-foreground md:text-6xl">
            <span className="font-serif italic">Click these</span> in order.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Each stop is a real route with real on-chain or cryptographic
            substance behind it. Estimated 8-12 minutes end-to-end. If
            you're a hackathon judge — this is the path that gives you
            everything you need to score the submission.
          </p>

          <div className="mt-20 space-y-12">
            {STEPS.map((step) => (
              <StepRow key={step.number} step={step} />
            ))}
          </div>

          <div className="mt-20 rounded-2xl border border-border/40 bg-card/40 p-8">
            <h2 className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
              After the tour
            </h2>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground">
              If you have questions:{" "}
              <Link href="/faq" className="underline">
                /faq
              </Link>
              . If you want to know what ships next:{" "}
              <Link href="/roadmap" className="underline">
                /roadmap
              </Link>
              . If you want to write about Compass:{" "}
              <Link
                href="https://github.com/StephenSook/Compass-OG-/blob/main/docs/press-kit.md"
                className="underline"
              >
                docs/press-kit.md
              </Link>
              .
            </p>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              If you want to fork for a different use case (refugee
              services, food bank, anonymous job-seeker eligibility, etc.):
              the contract surface is ~250 LoC of Solidity. Open an issue
              tagged{" "}
              <span className="font-mono">use-case-fork</span>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function StepRow({ step }: { step: Step }) {
  return (
    <div className="grid gap-6 md:grid-cols-[80px_1fr]">
      <div className="font-mono text-2xl text-muted-foreground/40">
        {step.number}
      </div>
      <div>
        <Link
          href={step.href}
          className="group inline-flex items-baseline gap-3"
        >
          <h3 className="text-xl font-medium text-foreground transition-colors group-hover:text-primary md:text-2xl">
            {step.title}
          </h3>
          <span className="font-mono text-xs text-muted-foreground/60 transition-colors group-hover:text-primary">
            →
          </span>
        </Link>
        <div className="mt-4 space-y-3 text-base text-muted-foreground">
          <p>
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
              What
            </span>
            <br />
            {step.what}
          </p>
          <p>
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
              Why it matters
            </span>
            <br />
            {step.whyItMatters}
          </p>
          <p>
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
              What lands on-chain
            </span>
            <br />
            {step.whatLandsOnChain}
          </p>
        </div>
      </div>
    </div>
  );
}
