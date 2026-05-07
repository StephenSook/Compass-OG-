import { LiquidGlass } from "@/components/primitives/LiquidGlass";
import { RevealText } from "@/components/primitives/RevealText";
import { MagneticButton } from "@/components/primitives/MagneticButton";

const RECEIPT_TX_HASH =
  "0x9d64e3953f12a9d2ca679d369c6fcf535512901c426551fbc5de761deeeed0ef";

export default function SubpoenaPage() {
  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <header className="px-6 pt-10 pb-6">
        <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase">
          HK Labour Department — Data Request under PDPO Cap. 486 §57
        </p>
        <p className="mt-2 font-mono text-xs tracking-[0.2em] text-muted-foreground/60 uppercase">
          Compass clinic disclosure log · subject: anonymous applicant · 2026-05-18 14:32:00 +08:00
        </p>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6">
        <LiquidGlass radius="xl" className="mb-16 h-[280px] w-full max-w-[800px] md:h-[400px]" />

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

          <p className="mt-12 text-sm text-muted-foreground md:text-base">
            No name. No HKID. No employer. No documents. The receipt log on
            chain carries hashes, a nullifier, an expiry, and an attestation
            digest — nothing that identifies the applicant.
          </p>

          <div className="mt-16 flex justify-center">
            <MagneticButton
              href={`https://chainscan-galileo.0g.ai/tx/${RECEIPT_TX_HASH}`}
              className="liquid-glass rounded-full px-8 py-4 font-mono text-xs tracking-[0.3em] text-foreground uppercase"
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
