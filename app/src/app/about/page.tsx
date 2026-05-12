import Link from "next/link";
import { ArchitectureDiagram } from "@/components/about/ArchitectureDiagram";
import { SplineScene } from "@/components/about/SplineScene";
import { GLASS_BASE, LiquidGlass } from "@/components/primitives/LiquidGlass";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { TeeStatusBadge } from "@/components/about/TeeStatusBadge";
import { Reveal } from "@/components/primitives/Reveal";

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
  { component: "AgentRegistry contract", state: "real", note: "ERC-7857 stripped; deployed to both 0G Galileo testnet (0x461e…c2D8) and 0G Aristotle mainnet (0xf1FA…0Bf9, 2026-05-11)" },
  { component: "CompassHub contract", state: "real", note: "policies + Authwit + receipts; deployed to both 0G Galileo testnet (0x60Bb…7c3b) and 0G Aristotle mainnet (0xe42f…C58b, 2026-05-11)" },
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
  { component: "Aristotle mainnet (chainId 16661) deploy", state: "real", note: "deployed 2026-05-11 — AgentRegistry 0xf1FA…0Bf9, CompassHub 0xe42f…C58b. All 3 demo policies registered on-chain (HELP, Bethune, Hospital); provider relayer 0xaD7…b0a funded 0.05 OG. Funding path: MoonPay → ETH on Ethereum L1 → hub.0g.ai TokenFlight Cross-Chain Swap (Hyperstream/Khalani) → native OG on Aristotle. /api/consume reads NEXT_PUBLIC_COMPASS_USE_MAINNET=1 and routes the relayer to Aristotle; unset routes it to Galileo." },
  { component: "Kiosk mode for NGO drop-in centres", state: "draft", note: "live at /kiosk — locked nav, 4-step welcome→sign-in→mint→credential→request-eligibility flow with large touch targets + plain-language labels + receipt-as-intake-artifact ending. Reuses Privy + on-chain primitives from /onboard, restyled for shared tablet use. v2 adds auto-reset timer + audio cues for low-literacy assistance" },
  { component: "Kiosk localization (5 languages)", state: "draft", note: "live at /kiosk welcome screen — language picker for English, Filipino (Tagalog), Bahasa Indonesia, Bahasa Malaysia, 廣東話 (Cantonese). All non-English strings are AI-generated baseline pending native-speaker review (gated on C.4 outreach replies). String table at app/src/lib/i18n/kiosk-strings.ts; current scope is kiosk-only — the rest of the app stays English. Honest-limits disclosure in the file header" },
  { component: "Spline 3D scene on /about", state: "real", note: "activated 2026-05-10. @splinetool/react-spline + @splinetool/runtime installed; <SplineScene /> renders below the architecture diagram when NEXT_PUBLIC_COMPASS_SPLINE_SCENE_URL is set. Lazy-imported behind Suspense so the runtime (~530KB) loads off the critical path. Falls back to null when env var is unset, so the route stays unchanged on a clean clone with no env file. R13 LCP guard still in force: if Lighthouse mobile drops below 85, swap to environmental SVG." },
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
    title: "SD-JWT VC encrypted in the browser",
    detail: "Per-device AES-256-GCM key generated in WebCrypto with extractable=false, persisted as an opaque CryptoKey handle in IndexedDB; only ciphertext + IV land in localStorage. 0G Storage upload (Merkle-root committed to AgentRegistry.encryptedURI) is on the v0.6 roadmap.",
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

          <Reveal delay={30}>
            <Section title="By the numbers">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Stat
                  number="368,000"
                  label="HK foreign domestic helpers at risk"
                  footnote="LegCo Research Office 2025"
                />
                <Stat
                  number="≈ US$22,200"
                  label="lost per worker per deportation"
                  footnote="HK Labour Dept 2025 + Amnesty 2013"
                />
                <Stat
                  number="≈ US$14,100"
                  label="lost per HK government case"
                  footnote="HK LAD FY24/25 + Budget Head 70"
                />
              </div>
              <p className="mt-8 max-w-3xl text-sm text-muted-foreground">
                Across APAC, 27.2 million migrant workers face similar
                disclosure traps (ILO Global Estimates, 2024). 17% of HK FDHs
                are in forced labour; 60% are deterred from filing Labour
                Tribunal claims by deportation fear. HK Legal Aid Department
                spent HK$679.6M on civil cases in FY2024/25 — none of it
                prevents the disclosure that triggers the deportation. Full
                TAM, cost per incident, and 12-month grant ladder in the{" "}
                <a
                  href="https://github.com/StephenSook/Compass-OG-/blob/main/docs/whitepaper.md#business-impact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  whitepaper Business Impact section
                </a>
                .
              </p>
            </Section>
          </Reveal>

          <Reveal>
            <Section title="Architecture">
              <ArchitectureDiagram />
              <SplineScene className="mt-8" />
            </Section>
          </Reveal>

          <Reveal delay={60}>
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
          </Reveal>

          <Reveal delay={120}>
            <Section title="How Compass differs from adjacent projects">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/40">
                    <Th>Project</Th>
                    <Th>What it proves</Th>
                    <Th>Where Compass differs</Th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/20">
                    <td className="py-4 pr-4 text-sm text-foreground">Worldcoin / World ID</td>
                    <td className="py-4 pr-4 text-sm text-muted-foreground">Proof of personhood via iris scan; one-human-one-vote primitive.</td>
                    <td className="py-4 text-sm text-muted-foreground">Compass proves <em>eligibility for a specific service</em>, not personhood. We don't take biometrics; the worker's claims live in an SD-JWT VC she controls, encrypted with a key only she holds.</td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="py-4 pr-4 text-sm text-foreground">Polygon ID</td>
                    <td className="py-4 pr-4 text-sm text-muted-foreground">ZK-proof-based verifiable credentials; selective disclosure of issuer-signed claims.</td>
                    <td className="py-4 text-sm text-muted-foreground">Compass v1 uses SD-JWT + sealed TEE inference instead of in-browser ZK proofs — sub-second receipt mint vs ~5-30s ZK proving. The v2 dual-path roadmap adds an optional ZK route for higher-threat contexts; see <span className="font-mono">docs/zk-future-work.md</span>.</td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="py-4 pr-4 text-sm text-foreground">Anon Aadhaar</td>
                    <td className="py-4 pr-4 text-sm text-muted-foreground">ZK proofs over India's Aadhaar ID; prove residency / age without revealing the Aadhaar number.</td>
                    <td className="py-4 text-sm text-muted-foreground">Compass is not tied to a specific issuer-of-record. Any NGO with an Ed25519 key can issue a credential that Compass verifies; the trust list is governed separately. The migrant-worker context typically has <em>no</em> trusted government issuer; NGO-issued credentials are the only available path.</td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="py-4 pr-4 text-sm text-foreground">zkPass</td>
                    <td className="py-4 pr-4 text-sm text-muted-foreground">Web2 data → ZK proofs; prove claims about your bank account, social profile, etc. without revealing the underlying account.</td>
                    <td className="py-4 text-sm text-muted-foreground">Compass operates on NGO-issued attestations of physical-world status (visa, employment, residency), not Web2 scraped data. The threat model — subpoena resistance for already-issued credentials — is different from "import my Web2 attribute privately."</td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="py-4 pr-4 text-sm text-foreground">Privacy Pools / Tornado Cash v2</td>
                    <td className="py-4 pr-4 text-sm text-muted-foreground">Anonymous transactions with optional inclusion proofs into a set of "honest" deposits.</td>
                    <td className="py-4 text-sm text-muted-foreground">Compass is not a transaction-privacy primitive — it's a credential-privacy primitive. The on-chain receipt is the audit trail the system <em>wants</em>; the privacy property is on the inputs the receipt commits to, not on hiding the receipt itself.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-6 max-w-3xl text-sm text-muted-foreground">
              We respect every project in this table — most of Compass'
              primitives were inspired by their work. The differentiation
              is in the migrant-worker threat model: <em>asynchronous
              subpoena resistance for NGO-issued service eligibility</em>,
              optimised for interactive intake at clinic kiosks.
            </p>
            </Section>
          </Reveal>

          <Reveal delay={150}>
            <Section title="Standards alignment">
              <p className="max-w-3xl text-base text-muted-foreground md:text-lg">
                Compass&apos; selective-disclosure path uses{" "}
                <span className="font-mono text-sm text-foreground/80">
                  SD-JWT VC
                </span>{" "}
                (
                <a
                  href="https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  draft-ietf-oauth-sd-jwt-vc
                </a>
                , advanced to <span className="font-mono text-sm text-foreground/80">-16</span>{" "}
                in April 2026; Compass v0.5 pins{" "}
                <span className="font-mono text-sm text-foreground/80">-15</span>{" "}
                for the hackathon cycle with a v0.6 roll-forward planned). This is
                the same wire format the EU Digital Identity Wallet (
                <a
                  href="https://eur-lex.europa.eu/eli/reg/2024/1183/oj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  eIDAS 2.0
                </a>
                , in effect 2025) standardised for member-state digital
                credentials. The underlying SD-JWT selective-disclosure
                primitive shipped as{" "}
                <a
                  href="https://datatracker.ietf.org/doc/rfc9601/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  RFC 9601
                </a>{" "}
                in December 2024.
              </p>
              <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
                What this buys us: a Compass-issued credential can be presented
                to any verifier built against the EUDIW reference stack, and
                conversely an NGO running Compass alongside an eIDAS-compliant
                wallet can interoperate without re-issuance. The honest caveat:
                until the IETF draft hits RFC, every implementation is
                tracking a moving target — Compass tracks it openly in{" "}
                <a
                  href="https://github.com/StephenSook/Compass-OG-/blob/main/docs/honest-limits.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  docs/honest-limits.md
                </a>{" "}
                §6.
              </p>
            </Section>
          </Reveal>

          <Reveal delay={180}>
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
          </Reveal>

          <Reveal delay={240}>
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
          </Reveal>

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

function Stat({
  number,
  label,
  footnote,
}: {
  number: string;
  label: string;
  footnote: string;
}) {
  return (
    <div className="border-l-2 border-border/40 pl-4">
      <p className="text-2xl font-medium text-foreground md:text-3xl">
        {number}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/50 uppercase">
        {footnote}
      </p>
    </div>
  );
}
