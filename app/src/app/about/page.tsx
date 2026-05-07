import Link from "next/link";
import { ArchitectureDiagram } from "@/components/about/ArchitectureDiagram";
import { GLASS_BASE, LiquidGlass } from "@/components/primitives/LiquidGlass";
import { StatusBadge } from "@/components/clinic/StatusBadge";

const INTEGRATION = [
  {
    component: "Agent ID",
    network: "0G Chain (AgentRegistry)",
    role: "Soulbound INFT bound to user's Privy wallet; carries encrypted vault URI",
  },
  {
    component: "Encrypted vault",
    network: "0G Storage",
    role: "AES-256-GCM ciphertext of SD-JWT VC bundle; root hash on-chain",
  },
  {
    component: "Sealed inference",
    network: "0G TeeML / Phala dstack TDX",
    role: "Decrypts vault inside enclave; evaluates policy; signs receipt",
  },
  {
    component: "Receipt log",
    network: "0G Chain (CompassHub)",
    role: "ReceiptIssued event with hashes only; 15-min timestamp bucket",
  },
] as const;

const REALITY = [
  { component: "AgentRegistry contract", state: "real", note: "ERC-7857 stripped, Galileo deployed" },
  { component: "CompassHub contract", state: "real", note: "policies + Authwit + receipts, Galileo deployed" },
  { component: "0G Storage encrypted vaults", state: "real", note: "AES-256-GCM round-trip" },
  { component: "Receipt-signer service", state: "real", note: "dstack TDX dual-boot; per-receipt quote freshness binding" },
  { component: "Phala Cloud TDX deploy", state: "draft", note: "runbook ready; user-side dashboard step pending" },
  { component: "SD-JWT VC issuers (HELP, Bethune, Hospital)", state: "mocked", note: "Ed25519 fixture issuers; not real NGOs" },
  { component: "Trust list governance", state: "stubbed", note: "owner-managed for v1; production needs DAO" },
  { component: "On-chain verifyAttestation", state: "stubbed", note: "off-chain enclave verification only" },
  { component: "0G broker processResponse co-signature", state: "draft", note: "out of scope for v1; receipt has its own signature chain" },
] as const;

const REALITY_TONE: Record<string, "positive" | "warning" | "neutral"> = {
  real: "positive",
  draft: "warning",
  mocked: "warning",
  stubbed: "neutral",
};

const CHAIN = [
  {
    n: 1,
    title: "User encrypts SD-JWT VC client-side",
    detail: "AES-256-GCM with PBKDF2-derived key (600k iter); ciphertext uploaded to 0G Storage.",
  },
  {
    n: 2,
    title: "Receipt-signer derives sealed key inside TDX",
    detail: "dstack.getKey('compass-receipt-signer') returns deterministic secp256k1 priv bound to MR_TD.",
  },
  {
    n: 3,
    title: "Per-receipt quote binds (signer, image, receiptId)",
    detail: "report_data = sha256(ethAddress || composeHash || receiptId) — defeats archived-quote replay.",
  },
  {
    n: 4,
    title: "Receipt signed with sealed key, digest covers quoteCommitment",
    detail: "secp256k1 lowS over canonicalized receipt; verifier recovers signer, matches against quote.",
  },
  {
    n: 5,
    title: "ReceiptIssued event on 0G Chain",
    detail: "Public fields only: receiptId, policyId, resultHash, attestationDigest, 15-min timestamp bucket.",
  },
];

export default function AboutPage() {
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
            About Compass
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-medium text-foreground md:text-6xl">
            <span className="font-serif italic">Bounded</span> disclosure, on the wire.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Compass is a private eligibility firewall on 0G. An autonomous
            agent reads encrypted credentials inside a TEE, evaluates a
            policy, and emits a non-identifying receipt. Clinics extend
            service. Subpoenas reach a log of bucketed timestamps and
            cryptographic hashes. No identity fields anywhere.
          </p>

          <Section title="Architecture">
            <ArchitectureDiagram />
          </Section>

          <Section title="0G integration">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/40">
                    <Th>Component</Th>
                    <Th>0G layer</Th>
                    <Th>Role</Th>
                  </tr>
                </thead>
                <tbody>
                  {INTEGRATION.map((row) => (
                    <tr key={row.component} className="border-b border-border/20">
                      <td className="py-4 pr-4 text-sm text-foreground">{row.component}</td>
                      <td className="py-4 pr-4 font-mono text-xs text-muted-foreground">{row.network}</td>
                      <td className="py-4 text-sm text-muted-foreground">{row.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="What's real / what's mocked">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/40">
                    <Th>Component</Th>
                    <Th>Status</Th>
                    <Th>Note</Th>
                  </tr>
                </thead>
                <tbody>
                  {REALITY.map((row) => (
                    <tr key={row.component} className="border-b border-border/20">
                      <td className="py-4 pr-4 text-sm text-foreground">{row.component}</td>
                      <td className="py-4 pr-4">
                        <StatusBadge tone={REALITY_TONE[row.state]} label={row.state} />
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Cryptographic chain">
            <ol className="space-y-5 text-sm text-muted-foreground md:text-base">
              {CHAIN.map((step) => (
                <li key={step.n} className="flex gap-4">
                  <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground/40">
                    0{step.n}
                  </span>
                  <div>
                    <p className="text-foreground">{step.title}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground/70">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Honest limits">
            <p className="text-base text-muted-foreground">
              Compass narrows disclosure but does not eliminate it. Coercion,
              deniable encryption, full k-anonymity against statistical
              re-identification, and SD-JWT VC draft churn all remain open
              issues. See{" "}
              <a
                href="https://github.com/StephenSook/Compass-OG-/blob/main/docs/honest-limits.md"
                className="text-foreground underline-offset-4 hover:underline"
              >
                docs/honest-limits.md
              </a>{" "}
              for the full list and the Phase 6 deferred-work tracker.
            </p>
          </Section>

          <Section title="Credits">
            <p className="text-sm text-muted-foreground">
              Persona narrative inspired by the work of Mission for Migrant
              Workers, HELP for Domestic Workers, and Bethune House Migrant
              Women's Refuge in Hong Kong. Compass does not represent any
              real worker; the demo flow is a composite. Built solo by Stephen
              Sookra for the 0G APAC Hackathon (Track 5).
            </p>
          </Section>

          <div className="mt-16 flex flex-wrap justify-center gap-4">
            <Link
              href="/clinic/subpoena"
              className={`${GLASS_BASE} rounded-full px-8 py-4 font-mono text-xs tracking-[0.3em] text-foreground uppercase`}
            >
              See the subpoena scene →
            </Link>
            <Link
              href="/clinic"
              className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              Open clinic dashboard →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-20">
      <h2 className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="pb-4 text-left font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
      {children}
    </th>
  );
}
