"use client";

import { useEffect } from "react";

export default function OnboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[onboard] route-level error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-lg text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
          Onboard
        </p>
        <h1 className="mt-4 text-3xl leading-tight font-medium text-foreground md:text-5xl">
          Wallet step <span className="font-serif italic">failed</span> to load.
        </h1>
        <p className="mt-6 text-sm text-muted-foreground md:text-base">
          The Privy embedded-wallet provider could not initialize. Most often
          this means NEXT_PUBLIC_PRIVY_APP_ID is misconfigured or the network
          dropped before the SDK finished bootstrapping. The fixture flow is
          still available — refresh to retry, or unset the env var to fall
          back.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-10 rounded-full border border-border px-6 py-3 font-mono text-xs tracking-[0.3em] text-foreground uppercase transition-colors hover:border-foreground/40"
        >
          Retry →
        </button>
      </div>
    </main>
  );
}
