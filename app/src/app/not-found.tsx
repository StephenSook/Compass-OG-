import Link from "next/link";
import { LiquidGlass } from "@/components/primitives/LiquidGlass";

export default function NotFound() {
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

      <section className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-2xl text-center">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
            404
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-medium text-foreground md:text-6xl">
            This page <span className="font-serif italic">doesn&apos;t exist</span>.
          </h1>
          <p className="mt-6 text-base text-muted-foreground md:text-lg">
            Neither does Maria&apos;s HKID, on-chain. We&apos;re consistent like
            that. Try one of these instead.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              Home →
            </Link>
            <Link
              href="/demo"
              className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              Guided demo →
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              About →
            </Link>
            <Link
              href="/clinic/subpoena"
              className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              The subpoena scene →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
