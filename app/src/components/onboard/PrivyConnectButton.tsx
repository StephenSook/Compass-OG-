"use client";

import { useEffect, useRef, useState } from "react";
import {
  getEmbeddedConnectedWallet,
  useLogin,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import type { Address } from "viem";

const PROVISION_TIMEOUT_MS = 30_000;

type Props = {
  /** Called when Privy reports authenticated + an embedded wallet is ready. */
  onConnected: (address: Address) => void;
};

export function PrivyConnectButton({ onConnected }: Props) {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { login } = useLogin({
    onError: (err) => {
      console.error("[privy] login failed", err);
    },
  });
  const [timedOut, setTimedOut] = useState(false);
  const inFlightRef = useRef(false);

  const wallet = getEmbeddedConnectedWallet(wallets);
  const address = wallet?.address as Address | undefined;

  // Sync parent state whenever Privy reports a connected embedded wallet.
  // This covers BOTH "user just clicked Connect" AND "warm session, page
  // refresh" — both produce identical SDK state, and both should leave the
  // parent's step 1 in `done` so step 2 unlocks.
  useEffect(() => {
    if (!ready || !authenticated || !address) return;
    onConnected(address);
  }, [ready, authenticated, address, onConnected]);

  // Provisioning timeout only applies to a freshly-started login flow that
  // never produced an address.
  useEffect(() => {
    if (!inFlightRef.current || !authenticated || address) return;
    const t = window.setTimeout(() => {
      console.error("[privy] embedded wallet provisioning timed out (30s)");
      setTimedOut(true);
      inFlightRef.current = false;
    }, PROVISION_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [authenticated, address]);

  useEffect(() => {
    if (address) inFlightRef.current = false;
  }, [address]);

  if (!ready) {
    return (
      <span className="rounded-full border border-border/40 px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
        loading…
      </span>
    );
  }

  if (authenticated && address) {
    const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
    return (
      <span className="rounded-full border border-green-400/30 px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-green-400/80 uppercase">
        ✓ {short}
      </span>
    );
  }

  if (inFlightRef.current && authenticated && !address) {
    return (
      <span className="rounded-full border border-amber-400/30 px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-amber-400/80 uppercase">
        provisioning…
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setTimedOut(false);
        inFlightRef.current = true;
        login();
      }}
      className="rounded-full border border-border px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-foreground uppercase transition-colors hover:border-foreground/40"
    >
      {timedOut ? "Retry" : "Connect"}
    </button>
  );
}
