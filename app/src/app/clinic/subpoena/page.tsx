"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { GLASS_BASE, LiquidGlass } from "@/components/primitives/LiquidGlass";
import { RevealText } from "@/components/primitives/RevealText";
import { MagneticButton } from "@/components/primitives/MagneticButton";
import { CANONICAL_RECEIPT_ID } from "@/lib/fixtures/receipts";

const RECEIPT_TX_HASH =
  "0xfcbe4a4d3afc742c8683ab1a45eb1512329e42ae5b466271863c961788fc8e41";

const FADE_IN = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function SubpoenaPage() {
  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <header className="px-6 pt-10 pb-6">
        <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase">
          Investigation Request — Clinic Disclosure Log (Simulated)
        </p>
        <p className="mt-2 font-mono text-xs tracking-[0.2em] text-muted-foreground/60 uppercase">
          Compass clinic disclosure log · subject: anonymous applicant · 2026-05-18 14:32:00 +08:00
        </p>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6">
        <motion.div
          aria-hidden="true"
          className="mb-16 w-full max-w-[800px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <LiquidGlass
            radius="xl"
            className="flex h-[280px] w-full items-center justify-center md:h-[400px]"
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
          <p className="mt-6 text-2xl leading-relaxed font-medium text-foreground md:text-4xl">
            <RevealText text="Someone qualified for free legal assistance at 14:32 on May 18, 2026." />
          </p>

          <motion.p
            className="mt-20 font-serif text-5xl leading-tight italic text-foreground md:text-7xl"
            initial={FADE_IN.initial}
            whileInView={FADE_IN.animate}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            That&apos;s all that exists.
          </motion.p>

          <motion.p
            className="mt-12 text-base leading-relaxed text-muted-foreground md:text-lg"
            initial={FADE_IN.initial}
            whileInView={FADE_IN.animate}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.7, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
          >
            No name. No HKID. No employer. No documents.
          </motion.p>

          <motion.div
            className="mt-16 flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: 2.0 }}
          >
            <MagneticButton
              href={`https://chainscan-galileo.0g.ai/tx/${RECEIPT_TX_HASH}`}
              ariaLabel="Verify receipt transaction on chainscan-galileo (opens new tab)"
              className={`${GLASS_BASE} rounded-full px-8 py-4 font-mono text-xs tracking-[0.3em] text-foreground uppercase`}
            >
              Verify on chain →
            </MagneticButton>
            <Link
              href={`/receipt/${CANONICAL_RECEIPT_ID}`}
              className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              See the receipt →
            </Link>
            <Link
              href="/audit"
              className="self-center font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground"
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
