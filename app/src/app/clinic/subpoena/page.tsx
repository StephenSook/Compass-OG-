"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { GLASS_BASE, LiquidGlass } from "@/components/primitives/LiquidGlass";
import { RevealText } from "@/components/primitives/RevealText";
import { MagneticButton } from "@/components/primitives/MagneticButton";
import { Term } from "@/components/primitives/Term";
import { CANONICAL_RECEIPT_ID } from "@/lib/fixtures/receipts";

// Galileo AgentMinted tx — proof of the soulbound agent identity. CTA
// label reflects what this URL actually shows; swap in a real
// ReceiptIssued tx + retitle once on-chain receipt minting ships.
const AGENT_MINT_TX_HASH =
  "0xfcbe4a4d3afc742c8683ab1a45eb1512329e42ae5b466271863c961788fc8e41";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export default function SubpoenaPage() {
  const reduced = useReducedMotion();

  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <header className="px-5 pt-8 pb-6 sm:px-6 sm:pt-10">
        <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase sm:text-xs">
          Investigation Request — Clinic Disclosure Log · <Term k="pdpo-57">PDPO Cap. 486 §57</Term>
        </p>
        <p className="mt-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase sm:text-xs">
          subject: anonymous applicant · 2026-05-18 14:32:00 +08:00
        </p>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-5 sm:px-6">
        <motion.div
          aria-hidden="true"
          className="mb-12 w-full max-w-[800px] sm:mb-16"
          animate={
            reduced
              ? { opacity: 0.6 }
              : { opacity: [0.4, 0.75, 0.4] }
          }
          transition={
            reduced
              ? { duration: 0 }
              : { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <LiquidGlass
            radius="xl"
            className="flex h-[200px] w-full items-center justify-center sm:h-[280px] md:h-[400px]"
          >
            <span className="font-mono text-[10px] tracking-[0.4em] text-muted-foreground/30 uppercase">
              [ no data ]
            </span>
          </LiquidGlass>
        </motion.div>

        <div className="max-w-3xl text-center">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
            Disclosed
          </p>
          <p className="mt-5 text-xl leading-relaxed font-medium text-foreground sm:mt-6 sm:text-2xl md:text-4xl">
            <RevealText text="Someone qualified for free legal assistance at 14:32 on May 18, 2026." />
          </p>

          <motion.p
            className="mt-14 font-serif text-4xl leading-tight italic text-foreground sm:mt-20 sm:text-5xl md:text-7xl"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={reduced ? undefined : { once: true, margin: "-20%" }}
            transition={{ duration: 0.9, delay: reduced ? 0 : 0.6, ease: EASE_OUT_EXPO }}
          >
            That&apos;s all that exists.
          </motion.p>

          <motion.p
            className="mt-10 text-sm leading-relaxed text-muted-foreground sm:mt-12 sm:text-base md:text-lg"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={reduced ? undefined : { once: true, margin: "-10%" }}
            transition={{ duration: 0.7, delay: reduced ? 0 : 1.4, ease: EASE_OUT_EXPO }}
          >
            No name. No HKID. No employer. No documents.
          </motion.p>

          <motion.div
            className="mt-12 flex flex-col items-center gap-3 sm:mt-16 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4"
            initial={reduced ? false : { opacity: 0 }}
            whileInView={reduced ? undefined : { opacity: 1 }}
            viewport={reduced ? undefined : { once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: reduced ? 0 : 2.0 }}
          >
            <MagneticButton
              href={`https://chainscan-galileo.0g.ai/tx/${AGENT_MINT_TX_HASH}`}
              ariaLabel="See the agent-mint transaction on chainscan-galileo (opens new tab)"
              className={`${GLASS_BASE} rounded-full px-6 py-3 text-center font-mono text-[10px] tracking-[0.3em] sm:px-8 sm:py-4 sm:text-xs text-foreground uppercase`}
            >
              See the agent on chain →
            </MagneticButton>
            <Link
              href={`/receipt/${CANONICAL_RECEIPT_ID}`}
              className="rounded-full border border-border px-6 py-3 text-center font-mono text-[10px] tracking-[0.3em] sm:px-8 sm:py-4 sm:text-xs text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              See the receipt →
            </Link>
            <Link
              href="/audit"
              className="rounded-full border border-border px-6 py-3 text-center font-mono text-[10px] tracking-[0.3em] sm:px-8 sm:py-4 sm:text-xs text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              Public audit log →
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="px-6 py-10 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 uppercase">
          End of disclosure
        </p>
      </footer>
    </main>
  );
}
