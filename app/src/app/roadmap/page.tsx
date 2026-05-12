import Link from "next/link";
import { LiquidGlass } from "@/components/primitives/LiquidGlass";

type Phase = {
  version: string;
  title: string;
  status: "shipped" | "next" | "later";
  bullets: string[];
};

const PHASES: Phase[] = [
  {
    version: "v0.5",
    title: "Aristotle mainnet · hackathon submission",
    status: "shipped",
    bullets: [
      "AgentRegistry + CompassHub deployed to 0G Aristotle mainnet (chainId 16661)",
      "Three demo policies registered on-chain: help-legal-aid, bethune-shelter, hk-fdh-hospital",
      "Browser AES-256-GCM vault with non-extractable WebCrypto key in IndexedDB",
      "SD-JWT VC live issuance + verification end-to-end",
      "Phala dstack TDX receipt-signer with per-receipt RA quote binding",
      "Codex GPT-5.5 adversarial pre-submission review caught 1 BLOCKER + fixed",
      "Slither 0.11.5 audit (101 detectors): 0 security findings",
      "5-language kiosk localization (en/fil/id/ms/yue)",
      "3D Spline scene + 3D force-graph audit visualisation",
    ],
  },
  {
    version: "v0.6",
    title: "Post-hackathon hardening (June-July 2026)",
    status: "next",
    bullets: [
      "Vercel KV / Upstash Redis migration for the /api/consume rate-limit (replace the in-memory bucket that doesn't survive cold starts)",
      "CSP header with per-domain allow-list + Next.js inline-script nonce strategy",
      "Browser-side 0G Storage upload — eliminate the Node CLI dependency for the encrypted vault path",
      "Native-speaker review of the 5 kiosk languages (gated on NGO outreach replies)",
      "Sentry error tracking activation with the privacy-scrubbing config from docs/notes/sentry-setup.md",
      "BetterStack uptime monitoring with public status page",
      "Live ReceiptIssued event feed on /audit (replace fixture data)",
    ],
  },
  {
    version: "v0.7",
    title: "On-chain trust-list governance (August-September 2026)",
    status: "next",
    bullets: [
      "TrustList contract on Aristotle implementing the 5-of-7 add quorum / 3-of-7 revoke quorum design from docs/trust-list-governance.md",
      "7-day timelock with 24-hour revoke expedite path",
      "Migration from the docs/policies/*.json file-based registry to the on-chain TrustList",
      "Initial 7-of-N trustee set seeded from real NGO + foundation partners (gated on partnership formalisation)",
      "Public dashboard at /governance showing trust-list state + pending proposals + voting history",
    ],
  },
  {
    version: "v0.8",
    title: "Real NGO integration (Q4 2026)",
    status: "later",
    bullets: [
      "First real NGO issuer (target: HELP for Domestic Workers or Bethune House) replaces the local Ed25519 fixture in the demo flow",
      "Hospital Authority free-care eligibility evaluation as a second live policy (gated on compliance review)",
      "Privacy-preserving analytics for partner NGOs: counts of receipts per policy / per timestamp bucket, with k-anonymity floor",
      "Multi-issuer SD-JWT VC bundle support — workers carry one credential redeemable across multiple NGOs without re-issuance",
    ],
  },
  {
    version: "v1.0",
    title: "ZK option + cross-region (2027)",
    status: "later",
    bullets: [
      "Optional ZK eligibility path per the SD-JWT-friendly Plonky2 sketch in docs/zk-future-work.md (interactive-grade proving target: <3s in WASM)",
      "TEE path remains the default; user chooses the trust model at intake",
      "Cross-region deployments: Compass-Singapore, Compass-Manila — same contracts, region-specific policy registries",
      "Mythril symbolic-execution audit pass before any v1.0 mainnet redeploy",
      "Formal threat-model document with academic peer review",
    ],
  },
];

export default function RoadmapPage() {
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
            Roadmap
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-medium text-foreground md:text-6xl">
            <span className="font-serif italic">What we built</span> · what's next.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            v0.5 is shipped — accepting receipts on Aristotle mainnet. Below
            is the honest sequence of what lands next, with the gating
            constraints stated up front. This roadmap deliberately avoids
            promises that depend on uncertain partnerships; items marked
            "later" are gated and labelled.
          </p>

          <div className="mt-20 space-y-16">
            {PHASES.map((phase) => (
              <PhaseRow key={phase.version} phase={phase} />
            ))}
          </div>

          <div className="mt-20 rounded-2xl border border-border/40 bg-card/40 p-8">
            <h2 className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
              How to influence this roadmap
            </h2>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground">
              File an issue with the{" "}
              <span className="font-mono">enhancement</span> label and the{" "}
              <span className="font-mono">Compass scope check</span>{" "}
              answered in the issue body. Items that pass the scope check
              and align with the migrant-worker threat model land on this
              page within the next milestone window.
            </p>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Larger scope changes — new use-case forks, new
              jurisdictions, new threat models — open a Discussion
              instead. Compass is solo-maintained; partnerships scale
              faster than scope sprawl.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="https://github.com/StephenSook/Compass-OG-/issues/new/choose"
                className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
              >
                File an issue →
              </Link>
              <Link
                href="/faq"
                className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
              >
                FAQ →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function PhaseRow({ phase }: { phase: Phase }) {
  const tone =
    phase.status === "shipped"
      ? "border-emerald-400/40 bg-emerald-400/5 text-emerald-300/80"
      : phase.status === "next"
        ? "border-amber-400/40 bg-amber-400/5 text-amber-300/80"
        : "border-border/40 bg-card/40 text-muted-foreground/60";

  const label =
    phase.status === "shipped"
      ? "shipped"
      : phase.status === "next"
        ? "next"
        : "later";

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-4">
        <span className="font-mono text-2xl text-foreground">
          {phase.version}
        </span>
        <h3 className="text-xl text-foreground md:text-2xl">{phase.title}</h3>
        <span
          className={`rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.3em] uppercase ${tone}`}
        >
          {label}
        </span>
      </div>
      <ul className="mt-6 space-y-3 text-base text-muted-foreground">
        {phase.bullets.map((b, i) => (
          <li key={i} className="flex gap-3">
            <span className="font-mono text-xs text-muted-foreground/60">
              ·
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
