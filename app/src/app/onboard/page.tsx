"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Address, Hex } from "viem";
import { GLASS_BASE, LiquidGlass } from "@/components/primitives/LiquidGlass";
import { PrivyConnectButton } from "@/components/onboard/PrivyConnectButton";
import { MintAgentButton } from "@/components/onboard/MintAgentButton";
import {
  IssueCredentialButton,
  type IssueResponse,
} from "@/components/onboard/IssueCredentialButton";
import { RequestEligibilityButton } from "@/components/onboard/RequestEligibilityButton";
import { activeChain, isPrivyEnabled } from "@/lib/chains";

const COMPASS_PROVIDER_ADDRESS = process.env.NEXT_PUBLIC_COMPASS_PROVIDER_ADDRESS as
  | `0x${string}`
  | undefined;
import {
  encryptText,
  getOrCreateVaultKey,
  isStoredLiveCredential,
  type StoredLiveCredential,
} from "@/lib/crypto/vault";

const LIVE_CREDENTIAL_STORAGE_KEY = "compass.live_credentials";

const AGENT_MINT_TX_HASH =
  "0xfcbe4a4d3afc742c8683ab1a45eb1512329e42ae5b466271863c961788fc8e41";

type StepId = "connect" | "mint" | "issue";
type StepState = "pending" | "running" | "done";

const STEP_LABELS: Record<StepId, string> = {
  connect: "connect wallet",
  mint: "mint agent",
  issue: "issue credential",
};

function labelFor(id: StepId): string {
  return STEP_LABELS[id];
}

type StepRecord = Record<StepId, StepState>;

const STEP_ORDER: readonly StepId[] = ["connect", "mint", "issue"] as const;

const INITIAL: StepRecord = {
  connect: "pending",
  mint: "pending",
  issue: "pending",
};

const STEP_TIMINGS: Record<StepId, number> = {
  connect: 800,
  mint: 1400,
  issue: 600,
};

export default function OnboardPage() {
  const [steps, setSteps] = useState<StepRecord>(INITIAL);
  const [walletAddress, setWalletAddress] = useState<Address | null>(null);
  const [liveMint, setLiveMint] = useState<{ tokenId: bigint; txHash: Hex } | null>(null);
  const [liveCredential, setLiveCredential] = useState<StoredLiveCredential | null>(null);
  const reduced = useReducedMotion();
  const timerIdsRef = useRef<Set<number>>(new Set());
  const privyOn = isPrivyEnabled();

  useEffect(() => {
    return () => {
      timerIdsRef.current.forEach((id) => window.clearTimeout(id));
      timerIdsRef.current.clear();
    };
  }, []);

  const start = (id: StepId) => {
    // Eligibility check from current render's state. The button's
    // `disabled` prop already enforces this at the DOM level; this
    // is belt-and-suspenders for programmatic clicks.
    if (steps[id] !== "pending") return;
    const i = STEP_ORDER.indexOf(id);
    if (i > 0 && steps[STEP_ORDER[i - 1]] !== "done") return;

    setSteps((s) => ({ ...s, [id]: "running" }));
    const tid = window.setTimeout(() => {
      timerIdsRef.current.delete(tid);
      setSteps((s) => ({ ...s, [id]: "done" }));
    }, reduced ? 0 : STEP_TIMINGS[id]);
    timerIdsRef.current.add(tid);
  };

  // Privy step 1 stays "pending" while the modal is open (no crypto work has
  // started yet) and goes straight to "done" once the embedded wallet address
  // arrives. Cancelled modal leaves state untouched — user can retry.
  const handlePrivyConnected = useCallback((address: Address) => {
    setWalletAddress(address);
    setSteps((s) => (s.connect === "done" ? s : { ...s, connect: "done" }));
  }, []);

  // Step 2 live-mint callback: receipt is mined, AgentMinted event decoded.
  const handleMinted = useCallback(
    (info: { tokenId: bigint; txHash: Hex }) => {
      setLiveMint(info);
      setSteps((s) => (s.mint === "done" ? s : { ...s, mint: "done" }));
    },
    [],
  );

  // Step 3 live-issue callback: SD-JWT VC signed by /api/issue, then encrypted
  // browser-side with the per-device AES-256-GCM vault key before localStorage
  // persist. Plaintext SD-JWT VC compact never touches localStorage. The
  // button awaits this callback so a failure here keeps Step 3 in error state
  // rather than flipping to "done".
  const handleIssued = useCallback(async (info: IssueResponse) => {
    if (typeof window === "undefined") return;
    const key = await getOrCreateVaultKey();
    const enc = await encryptText(info.sdjwtvc, key);
    const stored: StoredLiveCredential = {
      schema: "compass.live_credential.v2",
      ciphertext: enc.ciphertext,
      iv: enc.iv,
      algorithm: "AES-256-GCM",
      keySource: "indexeddb-random-256",
      bytesEncrypted: enc.bytesEncrypted,
      encryptedAt: Math.floor(Date.now() / 1000),
      issuerDid: info.issuerDid,
      vct: info.vct,
      claimNames: info.claimNames,
      issuedAt: info.issuedAt,
      expiresAt: info.expiresAt,
    };
    try {
      const raw = window.localStorage.getItem(LIVE_CREDENTIAL_STORAGE_KEY);
      // Drop any old plaintext-shape entries — the type guard rejects them.
      const arr: StoredLiveCredential[] = raw
        ? (JSON.parse(raw) as unknown[]).filter(isStoredLiveCredential)
        : [];
      arr.push(stored);
      window.localStorage.setItem(
        LIVE_CREDENTIAL_STORAGE_KEY,
        JSON.stringify(arr),
      );
    } catch (err) {
      console.warn("[onboard] localStorage persist failed", err);
    }
    setLiveCredential(stored);
    setSteps((s) => (s.issue === "done" ? s : { ...s, issue: "done" }));
  }, []);

  const reset = () => {
    timerIdsRef.current.forEach((id) => window.clearTimeout(id));
    timerIdsRef.current.clear();
    setSteps(INITIAL);
    setWalletAddress(null);
    setLiveMint(null);
    setLiveCredential(null);
  };
  const allDone = Object.values(steps).every((s) => s === "done");
  const firstIncompleteId: StepId | null =
    STEP_ORDER.find((id) => steps[id] !== "done") ?? null;

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
        <div className="w-full max-w-3xl">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
            Onboard
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-medium text-foreground md:text-6xl">
            Maria&apos;s <span className="font-serif italic">agent</span>, in three steps.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Soulbound agent, then a fixture eligibility credential.{" "}
            {privyOn
              ? "Step 1 uses the Privy embedded wallet; steps 2–3 are scripted fixtures that run in three seconds."
              : "Privy embedded wallet is env-gated (see docs/privy-setup.md); this fixture walkthrough runs in three seconds."}
          </p>

          <div role="status" aria-live="polite" className="sr-only">
            {firstIncompleteId === "connect" && steps.connect === "running" && "Connecting wallet"}
            {firstIncompleteId === "mint" && steps.mint === "running" && "Minting agent on Galileo"}
            {firstIncompleteId === "issue" && steps.issue === "running" && "Issuing demo credential"}
            {allDone && "All three steps complete"}
          </div>

          <div className="mt-12 flex items-center gap-4" aria-hidden="true">
            <div className="flex gap-2">
              {STEP_ORDER.map((id) => (
                <span
                  key={id}
                  className={`h-1.5 w-16 rounded-full transition-colors duration-500 ${
                    steps[id] === "done"
                      ? "bg-foreground/80"
                      : steps[id] === "running"
                        ? "bg-foreground/40"
                        : "bg-border/60"
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
              {STEP_ORDER.filter((id) => steps[id] === "done").length} of {STEP_ORDER.length}{allDone ? " · complete" : firstIncompleteId ? ` · ${labelFor(firstIncompleteId)}` : ""}
            </span>
          </div>

          <ol className="mt-8 space-y-4">
            <Step
              n={1}
              id="connect"
              state={steps.connect}
              isActive={firstIncompleteId === "connect"}
              title="Connect wallet"
              detail={
                privyOn
                  ? walletAddress
                    ? `Privy embedded wallet ready: ${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}. The wallet's secp256k1 key signs every consent.`
                    : "Privy embedded wallet. Email or Google login provisions a secp256k1 key on this device. The same key signs every consent."
                  : "Privy embedded wallet. Fixture here. The wallet's secp256k1 key signs every consent."
              }
              actionLabel="Connect"
              onAction={() => start("connect")}
              reduced={!!reduced}
              actionOverride={
                privyOn ? (
                  <PrivyConnectButton onConnected={handlePrivyConnected} />
                ) : undefined
              }
            />
            <Step
              n={2}
              id="mint"
              state={steps.mint}
              isActive={firstIncompleteId === "mint"}
              disabled={steps.connect !== "done"}
              title="Mint the agent"
              detail={
                privyOn && walletAddress
                  ? liveMint
                    ? `ERC-7857-stripped soulbound INFT, tokenId #${liveMint.tokenId.toString()} on 0G Galileo. The wallet that signed the mint is the canonical agent owner.`
                    : "ERC-7857-stripped soulbound INFT. AgentRegistry.mintAgent runs on 0G Galileo; the signing key is your Privy embedded wallet. You'll need a small amount of OG to pay gas — fund the wallet via the Galileo faucet if it's empty."
                  : "ERC-7857-stripped soulbound INFT, committed to the wallet. The tx hash below points to a prior real Galileo mint of an agent under the same contract — proof of the on-chain primitive, not this fixture walkthrough's mint."
              }
              actionLabel="Mint"
              onAction={() => start("mint")}
              reduced={!!reduced}
              actionOverride={
                privyOn && walletAddress && steps.connect === "done" ? (
                  <MintAgentButton
                    walletAddress={walletAddress}
                    onMinted={handleMinted}
                  />
                ) : undefined
              }
              footer={
                liveMint ? (
                  <a
                    // liveMint comes from MintAgentButton, which now uses
                    // activeChain() — link must point at the matching
                    // scanner (whole-codebase review 2026-05-11). The
                    // fixture AGENT_MINT_TX_HASH below stays on chainscan-
                    // galileo because that specific hash was minted on
                    // Galileo and exists only there.
                    href={`${activeChain().blockExplorers.default.url}/tx/${liveMint.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase transition-colors hover:text-foreground"
                  >
                    {liveMint.txHash.slice(0, 14)}…{liveMint.txHash.slice(-8)} ↗
                  </a>
                ) : steps.mint === "done" ? (
                  <a
                    href={`https://chainscan-galileo.0g.ai/tx/${AGENT_MINT_TX_HASH}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase transition-colors hover:text-foreground"
                  >
                    {AGENT_MINT_TX_HASH.slice(0, 14)}…{AGENT_MINT_TX_HASH.slice(-8)} ↗
                  </a>
                ) : null
              }
            />
            <Step
              n={3}
              id="issue"
              state={steps.issue}
              isActive={firstIncompleteId === "issue"}
              disabled={steps.mint !== "done"}
              title="Issue demo credential"
              detail={
                privyOn && walletAddress && liveMint
                  ? liveCredential
                    ? `Live SD-JWT VC signed by /api/issue at ${new Date(liveCredential.issuedAt * 1000).toLocaleTimeString()}, then AES-256-GCM-encrypted browser-side. ${liveCredential.bytesEncrypted}-byte ciphertext stored in localStorage; plaintext SD-JWT VC never persists in the browser.`
                    : "Vercel API route /api/issue signs an Ed25519 SD-JWT VC with HELP-fixture claims; the browser then encrypts it with a per-device AES-256-GCM key (non-extractable, IndexedDB) before persisting. 0G Storage ciphertext upload is still v2."
                  : "Fixture HELP for Domestic Workers SD-JWT VC. Real NGO; signing key is a local Ed25519 fixture. Live signing + browser encryption flip on when ISSUER_PRIVATE_KEY is set and Privy is wired."
              }
              actionLabel="Issue"
              onAction={() => start("issue")}
              reduced={!!reduced}
              actionOverride={
                privyOn && walletAddress && liveMint && steps.mint === "done" ? (
                  <IssueCredentialButton
                    walletAddress={walletAddress}
                    onIssued={handleIssued}
                  />
                ) : undefined
              }
              footer={
                liveCredential ? (
                  <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
                    {liveCredential.bytesEncrypted} B AES-256-GCM · {liveCredential.claimNames.length} claims · iv {liveCredential.iv.slice(0, 6)}…
                  </span>
                ) : null
              }
            />
          </ol>

          {allDone ? (
            <motion.div
              className="mt-16"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
                Done
              </p>
              <p className="mt-4 text-2xl text-foreground md:text-3xl">
                Maria&apos;s agent is <span className="font-serif italic">ready</span>.
              </p>
              <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
                Pick what to inspect next. The fixture agent and demo
                credential are ready; the receipt log shows the only thing a
                clinic ever sees about her.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {privyOn && walletAddress && liveMint && COMPASS_PROVIDER_ADDRESS ? (
                  <RequestEligibilityButton
                    walletAddress={walletAddress}
                    agentTokenId={liveMint.tokenId}
                    providerAddress={COMPASS_PROVIDER_ADDRESS}
                    onIssued={() => {
                      /* result stays in the button's local state; future
                       * polish: lift to page state + show full receipt
                       * card here. */
                    }}
                  />
                ) : (
                  <Link
                    href="/receipt/1"
                    className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
                  >
                    See the receipt →
                  </Link>
                )}
                <Link
                  href="/vault"
                  className={`${GLASS_BASE} rounded-full px-8 py-4 font-mono text-xs tracking-[0.3em] text-foreground uppercase`}
                >
                  Open the vault →
                </Link>
                <Link
                  href="/clinic/subpoena"
                  className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
                >
                  See the disclosure scene →
                </Link>
                <button
                  type="button"
                  onClick={reset}
                  className="self-center font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground"
                >
                  Reset →
                </button>
              </div>
            </motion.div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

type StepProps = {
  n: number;
  id: StepId;
  state: StepState;
  isActive: boolean;
  disabled?: boolean;
  title: string;
  detail: string;
  actionLabel: string;
  onAction: () => void;
  reduced: boolean;
  footer?: React.ReactNode;
  /** Replaces the default ActionButton entirely (used by the Privy step). */
  actionOverride?: ReactNode;
};

function Step({
  n,
  state,
  isActive,
  disabled,
  title,
  detail,
  actionLabel,
  onAction,
  reduced,
  footer,
  actionOverride,
}: StepProps) {
  const opacity = isActive || state === "done" ? "opacity-100" : "opacity-50";
  return (
    <motion.li
      className={`rounded-2xl border p-6 transition-colors ${
        state === "done" ? "border-foreground/30" : "border-border/40"
      } ${opacity}`}
      animate={
        reduced
          ? {}
          : isActive
            ? { borderColor: "rgba(255,255,255,0.3)" }
            : { borderColor: "rgba(255,255,255,0.1)" }
      }
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-baseline gap-4">
          <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground/40">
            0{n}
          </span>
          <div>
            <h2 className="text-xl text-foreground md:text-2xl">{title}</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{detail}</p>
            {footer ? <div className="mt-3">{footer}</div> : null}
          </div>
        </div>
        {actionOverride ?? (
          <ActionButton
            state={state}
            disabled={disabled}
            label={actionLabel}
            onClick={onAction}
          />
        )}
      </div>
    </motion.li>
  );
}

function ActionButton({
  state,
  disabled,
  label,
  onClick,
}: {
  state: StepState;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  if (state === "done") {
    return (
      <span
        aria-label="step complete"
        className="rounded-full border border-green-400/30 px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-green-400/80 uppercase"
      >
        ✓ done
      </span>
    );
  }
  if (state === "running") {
    return (
      <span className="rounded-full border border-amber-400/30 px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-amber-400/80 uppercase">
        running…
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-border px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-foreground uppercase transition-colors hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {label}
    </button>
  );
}
