import Link from "next/link";
import { BlurText } from "@/components/primitives/BlurText";
import { LiquidGlass } from "@/components/primitives/LiquidGlass";
import { AmbientSphere } from "@/components/primitives/AmbientSphere";

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col bg-background overflow-hidden">
      <header className="fixed top-6 left-1/2 z-50 -translate-x-1/2">
        <LiquidGlass radius="full" className="px-6 py-2">
          <span className="font-mono text-xs tracking-[0.3em] text-foreground uppercase">
            COMPASS
          </span>
        </LiquidGlass>
      </header>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-60">
        <AmbientSphere
          className="h-[80vmin] w-[80vmin] max-h-[640px] max-w-[640px]"
          size={640}
        />
      </div>

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-24 pb-16 sm:pt-0 sm:pb-0">
        <p className="mb-6 text-center font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase sm:mb-8 sm:text-xs">
          A Private Eligibility Firewall on 0G
        </p>

        <h1 className="max-w-4xl text-center text-3xl leading-tight font-medium text-foreground sm:text-4xl md:text-7xl">
          <BlurText
            text="Prove eligibility, not identity."
            italicWords={["identity"]}
          />
        </h1>

        <p className="mt-8 max-w-2xl text-center text-sm text-muted-foreground sm:mt-10 sm:text-base md:text-lg">
          Maria works 16 hours a day in a Hong Kong apartment. When she needs
          free legal help, she should not have to hand over her passport, her
          contract, and her HKID just to ask the question.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:mt-12 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
          <Link
            href="/onboard"
            className="rounded-full border border-foreground/40 px-6 py-3 font-mono text-[10px] tracking-[0.3em] text-foreground uppercase transition-colors hover:border-foreground/80 sm:px-8 sm:py-4 sm:text-xs"
          >
            Onboard Maria&apos;s agent →
          </Link>
          <Link
            href="/clinic/subpoena"
            className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground sm:text-xs"
          >
            See the disclosure log →
          </Link>
          <Link
            href="/vault"
            className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground sm:text-xs"
          >
            Open the vault →
          </Link>
          <Link
            href="/about"
            className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground sm:text-xs"
          >
            About →
          </Link>
        </div>
      </section>
    </main>
  );
}
