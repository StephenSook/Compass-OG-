import { LiquidGlass } from "@/components/primitives/LiquidGlass";
import { RevealText } from "@/components/primitives/RevealText";
import { MagneticButton } from "@/components/primitives/MagneticButton";

// Day-3 mint w/ live 0G Storage rootHash 0x4d188a35...c115b7 in the
// AgentMinted event. Swap to a real ReceiptIssued tx once
// CompassHub.issueReceipt fires in Phase 6.
const RECEIPT_TX_HASH =
  "0xfcbe4a4d3afc742c8683ab1a45eb1512329e42ae5b466271863c961788fc8e41";

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
        <LiquidGlass
          radius="xl"
          aria-hidden="true"
          className="mb-16 flex h-[280px] w-full max-w-[800px] items-center justify-center motion-safe:animate-pulse md:h-[400px]"
        >
          <span className="font-mono text-[10px] tracking-[0.4em] text-muted-foreground/30 uppercase">
            [ no data ]
          </span>
        </LiquidGlass>

        <div className="max-w-3xl text-center">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
            Disclosed
          </p>
          <p className="mt-6 text-2xl leading-relaxed font-medium text-foreground md:text-4xl">
            <RevealText text="Someone qualified for free legal assistance at 14:32 on May 18, 2026." />
          </p>

          <p className="mt-20 font-serif text-5xl leading-tight italic text-foreground md:text-7xl">
            That&apos;s all that exists.
          </p>

          <p className="mt-12 text-base leading-relaxed text-muted-foreground md:text-lg">
            No name. No HKID. No employer. No documents.
          </p>

          <div className="mt-16 flex justify-center">
            <MagneticButton
              href={`https://chainscan-galileo.0g.ai/tx/${RECEIPT_TX_HASH}`}
              ariaLabel="Verify receipt transaction on chainscan-galileo (opens new tab)"
              className="liquid-glass-border bg-white/[0.02] backdrop-blur-md backdrop-saturate-150 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] rounded-full px-8 py-4 font-mono text-xs tracking-[0.3em] text-foreground uppercase"
            >
              Verify on chain →
            </MagneticButton>
          </div>
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
