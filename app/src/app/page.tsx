import { BlurText } from "@/components/primitives/BlurText";
import { LiquidGlass } from "@/components/primitives/LiquidGlass";

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

      <section className="flex flex-1 flex-col items-center justify-center px-6">
        <p className="mb-8 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase">
          A Private Eligibility Firewall on 0G
        </p>

        <h1 className="max-w-4xl text-center text-4xl leading-tight font-medium text-foreground md:text-7xl">
          <BlurText text="Prove eligibility, not" />
          <span className="font-serif italic"> identity</span>
          <span>.</span>
        </h1>

        <p className="mt-10 max-w-2xl text-center text-base text-muted-foreground md:text-lg">
          Maria works 16 hours a day in a Hong Kong apartment. When she needs
          free legal help, she should not have to hand over her passport, her
          contract, and her HKID just to ask the question.
        </p>
      </section>
    </main>
  );
}
