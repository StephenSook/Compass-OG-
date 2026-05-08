"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { GLASS_BASE, LiquidGlass } from "@/components/primitives/LiquidGlass";

const AGENT_MINT_TX_HASH =
  "0xfcbe4a4d3afc742c8683ab1a45eb1512329e42ae5b466271863c961788fc8e41";

type StepId = "connect" | "mint" | "issue";
type StepState = "pending" | "running" | "done";

type StepRecord = Record<StepId, StepState>;

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
  const reduced = useReducedMotion();

  const start = (id: StepId) => {
    if (steps[id] !== "pending") return;
    setSteps((s) => ({ ...s, [id]: "running" }));
    window.setTimeout(() => {
      setSteps((s) => ({ ...s, [id]: "done" }));
    }, reduced ? 0 : STEP_TIMINGS[id]);
  };

  const reset = () => setSteps(INITIAL);
  const allDone = Object.values(steps).every((s) => s === "done");
  const activeId: StepId | null = (["connect", "mint", "issue"] as const).find(
    (id) => steps[id] !== "done",
  ) ?? null;

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
            Compass mints a soulbound agent identity for Maria, then issues her
            a fixture eligibility credential. Real Privy wallet integration is
            on the v1 roadmap; this walkthrough is fixture-mode and runs in ~3
            seconds.
          </p>

          <div role="status" aria-live="polite" className="sr-only">
            {activeId === "connect" && steps.connect === "running" && "Connecting wallet"}
            {activeId === "mint" && steps.mint === "running" && "Minting agent on Galileo"}
            {activeId === "issue" && steps.issue === "running" && "Issuing demo credential"}
            {allDone && "All three steps complete"}
          </div>

          <ol className="mt-16 space-y-4">
            <Step
              n={1}
              id="connect"
              state={steps.connect}
              isActive={activeId === "connect"}
              title="Connect wallet"
              detail="Privy embedded wallet — fixture-mode here; real Privy integration is the v1 roadmap. The wallet's secp256k1 key signs Authwit grants and Aztec-style consent."
              actionLabel="Connect"
              onAction={() => start("connect")}
              reduced={!!reduced}
            />
            <Step
              n={2}
              id="mint"
              state={steps.mint}
              isActive={activeId === "mint"}
              disabled={steps.connect !== "done"}
              title="Mint the agent"
              detail="ERC-7857-stripped soulbound INFT. The agent ID commits to the wallet. The tx below is the live Galileo mint — Compass already has agents on-chain."
              actionLabel="Mint"
              onAction={() => start("mint")}
              reduced={!!reduced}
              footer={
                steps.mint === "done" ? (
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
              isActive={activeId === "issue"}
              disabled={steps.mint !== "done"}
              title="Issue demo credential"
              detail="Fixture HELP for Domestic Workers SD-JWT VC, AES-256-GCM-encrypted client-side, uploaded to 0G Storage. Real NGO; signing key is a local Ed25519 fixture."
              actionLabel="Issue"
              onAction={() => start("issue")}
              reduced={!!reduced}
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
                Pick what to inspect next. The agent + credential exist; the
                receipt log shows the only thing a clinic ever sees about her.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/clinic/subpoena"
                  className={`${GLASS_BASE} rounded-full px-8 py-4 font-mono text-xs tracking-[0.3em] text-foreground uppercase`}
                >
                  See the disclosure scene →
                </Link>
                <Link
                  href="/receipt/1"
                  className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
                >
                  See the receipt →
                </Link>
                <button
                  type="button"
                  onClick={reset}
                  className="self-center font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground"
                >
                  Run again →
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
        <ActionButton
          state={state}
          disabled={disabled}
          label={actionLabel}
          onClick={onAction}
        />
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
