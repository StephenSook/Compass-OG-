import Link from "next/link";
import { ArchitectureDiagram } from "@/components/about/ArchitectureDiagram";
import { GLASS_BASE, LiquidGlass } from "@/components/primitives/LiquidGlass";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { TeeStatusBadge } from "@/components/about/TeeStatusBadge";

const INTEGRATION = [
  {
    component: "Agent ID",
    network: "0G Chain (AgentRegistry)",
    role: "Soulbound INFT bound to the user's EOA; Privy embedded wallet wires the EOA when NEXT_PUBLIC_PRIVY_APP_ID is set, fixture mode otherwise",
  },
  {
    component: "Encrypted vault",
    network: "0G Storage",
    role: "AES-256-GCM ciphertext of SD-JWT VC bundle; root hash on-chain",
  },
  {
    component: "Sealed inference",
    network: "0G TeeML / Phala dstack TDX",
    role: "Receives selectively-disclosed claims; evaluates policy; signs receipt with sealed key",
  },
  {
    component: "Receipt log",
    network: "0G Chain (CompassHub)",
    role: "ReceiptIssued: receiptId, policyId, nullifier, agentIdCommitment, resultHash, attestationDigest, expiry, 15-min timestamp bucket — no name, HKID, employer, or document fields",
  },
] as const;

type RealityState = "real" | "draft" | "mocked" | "stubbed";

const REALITY: ReadonlyArray<{ component: string; state: RealityState; note: string }> = [
  { component: "AgentRegistry contract", state: "real", note: "ERC-7857 stripped, Galileo deployed" },
  { component: "CompassHub contract", state: "real", note: "policies + Authwit + receipts, Galileo deployed" },
  { component: "Browser AES-256-GCM encryption", state: "real", note: "live on /onboard step 3 — non-extractable AES-256 in IndexedDB encrypts the issued SD-JWT VC before localStorage persist; plaintext never enters localStorage" },
  { component: "0G Storage ciphertext upload", state: "draft", note: "AES-256-GCM round-trip on Node CLI; live 0G upload behind COMPASS_LIVE_STORAGE=1; browser-side upload is v2" },
  { component: "Receipt-signer service", state: "real", note: "dstack TDX dual-boot; per-receipt quote freshness binding" },
  { component: "Phala Cloud TDX deploy", state: "real", note: "live: ethAddress 0xaba6...a7e7, composeHash 0x1884...cea0 — see docs/notes/phala-deployment.md" },
  { component: "SD-JWT VC issuers (HELP, Bethune, Hospital)", state: "mocked", note: "real NGOs; signing keys are local Ed25519 fixtures, not endorsed by the NGOs" },
  { component: "SD-JWT VC live issuer service", state: "draft", note: "POST /api/issue signs Ed25519 SD-JWT VC when ISSUER_PRIVATE_KEY env set; rendered in /vault from localStorage. v2 adds browser AES-256-GCM + 0G Storage upload" },
  { component: "Trust list governance", state: "draft", note: "v1 owner-managed via docs/policies/*.json; v2 DAO design specced at docs/trust-list-governance.md (5-of-7 quorum for adds, 3-of-7 for revokes, 7-day timelock with 24h revoke expedite, on-chain TrustList contract on Aristotle)" },
  { component: "On-chain verifyAttestation", state: "stubbed", note: "real RA quote verification is gas-prohibitive on-chain (cert chain + ECDSA + 4KB quote); off-chain verifier in enclave/src/verify-attestation.ts + verify-receipt CLI does the heavy lift" },
  { component: "RA-quote-bound attestationDigest in receipts", state: "real", note: "/api/consume calls live Phala TDX enclave (composeHash 0x1884…cea0, signer 0xaba6…a7e7); attestationDigest is sha256 of canonicalized receipt + per-receipt TDX quote whose report_data binds (signer, image, receiptId). Live state surfaced at /api/tee-status; falls back to stub digest if the enclave is stopped between demo cycles" },
  { component: "0G broker processResponse co-signature", state: "draft", note: "out of scope for v1; receipt has its own signature chain" },
  { component: "Privy embedded wallet", state: "draft", note: "wired in /onboard step 1; live behind NEXT_PUBLIC_PRIVY_APP_ID, fixture timer in default build" },
  { component: "/onboard step 2 — live mintAgent", state: "draft", note: "Privy embedded wallet → AgentRegistry.mintAgent on Galileo (chainId 16602), gated on user-funded gas; fixture timer when Privy is unset" },
  { component: "Authwit grant — browser-side EIP-712 signing", state: "real", note: "Privy embedded wallet signs the Compass Grant typed data on /onboard step 4 (Galileo chainId 16602, CompassHub verifying contract), no popup-required sub-flow" },
  { component: "CompassHub.consumeGrantAndIssueReceipt — atomic on-chain", state: "real", note: "POST /api/consume relays Maria's signed grant; PROVIDER_PRIVATE_KEY-held wallet calls Galileo CompassHub; emits GrantConsumed + ReceiptIssued in one tx; nullifier + receiptId stored as used" },
  { component: "Aristotle mainnet (chainId 16661) deploy", state: "real", note: "deployed 2026-05-10 — AgentRegistry 0xf1FA…0Bf9, CompassHub 0xe42f…C58b. HELP policy registered (tx 0xc19a567d…c0f2); provider relayer 0xaD7…b0a funded 0.05 OG. Funding path: MoonPay → ETH on Ethereum L1 → hub.0g.ai TokenFlight Cross-Chain Swap (Hyperstream/Khalani) → native OG on Aristotle. Frontend defaults to Galileo until NEXT_PUBLIC_COMPASS_USE_MAINNET=1 is set" },
  { component: "Kiosk mode for NGO drop-in centres", state: "draft", note: "live at /kiosk — locked nav, 4-step welcome→sign-in→mint→credential→request-eligibility flow with large touch targets + plain-language labels + receipt-as-intake-artifact ending. Reuses Privy + on-chain primitives from /onboard, restyled for shared tablet use. v2 adds auto-reset timer + audio cues for low-literacy assistance" },
  { component: "Kiosk localization (5 languages)", state: "draft", note: "live at /kiosk welcome screen — language picker for English, Filipino (Tagalog), Bahasa Indonesia, Bahasa Malaysia, 廣東話 (Cantonese). All non-English strings are AI-generated baseline pending native-speaker review (gated on C.4 outreach replies). String table at app/src/lib/i18n/kiosk-strings.ts; current scope is kiosk-only — the rest of the app stays English. Honest-limits disclosure in the file header" },
  { component: "Spline 3D scene on /about", state: "draft", note: "scaffolded at app/src/components/about/SplineScene.tsx; lazy-imports @splinetool/react-spline only when NEXT_PUBLIC_COMPASS_SPLINE_SCENE_URL env var is set, so the bundle is unchanged until user (a) npm-installs the dep, (b) composes a scene at app.spline.design, (c) sets the env var. R13 LCP guard: fall back to environmental SVG if Lighthouse mobile drops below 85" },
  { component: "HLS / MP4 hero video background on /", state: "draft", note: "scaffolded at app/src/components/primitives/VideoBackground.tsx; renders null until NEXT_PUBLIC_COMPASS_HERO_VIDEO_URL env var points at an HLS playlist (.m3u8) or MP4 URL. Default hero uses AmbientSphere SVG. Asset prep + Pexels sourcing + ffmpeg recipe documented in docs/notes/hero-video-sourcing.md. R16 LCP guard: Lighthouse mobile floor 85; rollback is unsetting the env var" },
  { component: "3D force-graph view of public audit log", state: "real", note: "live at /audit-graph.html — standalone HTML using 3d-force-graph CDN; bucket-clustered receipt nodes with no inter-receipt edges (cannot suggest correlation between disclosures). Gentle camera orbit + per-policy color. v2 swaps the fixture node list for live Galileo ReceiptIssued event queries" },
];

const REALITY_TONE: Record<RealityState, "positive" | "warning" | "neutral"> = {
  real: "positive",
  draft: "warning",
  mocked: "warning",
  stubbed: "neutral",
};

const CHAIN = [
  {
    n: 1,
    title: "SD-JWT VC encrypted with user-derived key",
    detail: "AES-256-GCM with PBKDF2(600k iter); ciphertext uploaded to 0G Storage. v1 encryption runs from a Node CLI; browser-side encryption is on the v2 roadmap.",
  },
  {
    n: 2,
    title: "Receipt-signer derives sealed key inside TDX",
    detail: "dstack.getKey('compass-receipt-signer') returns a deterministic secp256k1 priv sealed to the attested image; composeHash is the externally-verifiable binding.",
  },
  {
    n: 3,
    title: "Per-receipt quote binds (signer, image, receiptId)",
    detail: "report_data = sha256(ethAddress || composeHash || receiptId). Defeats archived-quote replay across deployments.",
  },
  {
    n: 4,
    title: "Receipt signed with sealed key, digest covers quoteCommitment",
    detail: "secp256k1 lowS over canonicalized receipt; verifier recovers signer, matches against quote, validates the chain.",
  },
  {
    n: 5,
    title: "ReceiptIssued event on 0G Chain",
    detail: "receiptId, policyId, nullifier, agentIdCommitment, resultHash, attestationDigest, expiry, 15-min timestampBucket. No name, HKID, employer, or document fields.",
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
            Compass is a private eligibility firewall on 0G. Clinics extend
            service. Subpoenas reach bucketed timestamps and cryptographic
            commitments. No name, HKID, employer, or document fields.
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
            <div className="mb-4">
              <TeeStatusBadge />
            </div>
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
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline-offset-4 hover:underline"
              >
                docs/honest-limits.md
              </a>{" "}
              for the full list.
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
              href="/audit"
              className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              Public audit log →
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
