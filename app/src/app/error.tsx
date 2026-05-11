"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LiquidGlass } from "@/components/primitives/LiquidGlass";

// Global error boundary for the App Router. Triggers on any uncaught
// exception in a server component, route handler, or client component
// that bubbles past route-level error.tsx boundaries.
//
// Per Next.js conventions, this file MUST be a client component
// ("use client") and export a default function that accepts `error` and
// `reset`. The reset() call retries the segment that errored.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to console for local debugging; in production this lands in
    // Vercel function logs. When Sentry activates (see
    // docs/notes/sentry-setup.md), wire Sentry.captureException(error)
    // here.
    console.error("[compass/error.tsx]", error);
  }, [error]);

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
            500 · something broke
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-medium text-foreground md:text-6xl">
            The receipt-signer <span className="font-serif italic">probably didn&apos;t</span>.
          </h1>
          <p className="mt-6 text-base text-muted-foreground md:text-lg">
            The on-chain audit log, the Phala TDX enclave, and the SD-JWT
            credential layer are independent of this UI. If you were mid-flow,
            your wallet signature and receipt are likely fine. Retry below; if
            the problem persists, the TEE status probe is at{" "}
            <Link href="/api/tee-status" className="underline">
              /api/tee-status
            </Link>
            .
          </p>

          {error.digest ? (
            <p className="mt-4 font-mono text-xs text-muted-foreground/60">
              digest · {error.digest}
            </p>
          ) : null}

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => reset()}
              className="rounded-full border border-foreground/40 bg-foreground/5 px-8 py-4 font-mono text-xs tracking-[0.3em] text-foreground uppercase transition-colors hover:bg-foreground/10"
            >
              Retry →
            </button>
            <Link
              href="/"
              className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              Home →
            </Link>
            <Link
              href="/api/tee-status"
              className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              TEE status →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
