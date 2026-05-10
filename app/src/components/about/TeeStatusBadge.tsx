"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/primitives/Skeleton";

type TeeStatus = {
  mode: "tee" | "env" | "degraded" | "unconfigured";
  enclaveUrl: string | null;
  reachable: boolean;
  signer?: string | null;
  source?: string | null;
  message?: string;
};

/**
 * Live probe of /api/tee-status surfaced in /about. Demonstrates that the
 * "RA-quote-bound attestationDigest" reality row is currently real-real
 * (mode=tee + reachable) rather than just shipped-and-hoping.
 *
 * The fetch runs on mount; while in-flight the skeleton stand-in keeps the
 * row layout stable. After the response, the badge reflects the live mode
 * and (in tee mode) the signer address. No polling — one fetch per page
 * load is enough; the value moves on the order of hours, not seconds.
 */
export function TeeStatusBadge() {
  const [status, setStatus] = useState<TeeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tee-status")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<TeeStatus>;
      })
      .then((j) => {
        if (cancelled) return;
        setStatus(j);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/5 px-3 py-1">
        <span className="h-2 w-2 rounded-full bg-amber-400/80" aria-hidden="true" />
        <span className="font-mono text-[10px] tracking-[0.2em] text-amber-400/80 uppercase">
          probe failed
        </span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-border/40 px-3 py-1">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-3 w-32" />
      </div>
    );
  }

  const dotClass =
    status.mode === "tee"
      ? "bg-green-400"
      : status.mode === "env"
        ? "bg-amber-400"
        : status.mode === "degraded"
          ? "bg-amber-400/60"
          : "bg-muted-foreground/40";
  const labelClass =
    status.mode === "tee"
      ? "text-green-400/90"
      : status.mode === "env"
        ? "text-amber-400/90"
        : status.mode === "degraded"
          ? "text-amber-400/70"
          : "text-muted-foreground/60";
  const label =
    status.mode === "tee"
      ? `tee live · signer ${(status.signer ?? "").slice(0, 10)}…`
      : status.mode === "env"
        ? "env-mode signer"
        : status.mode === "degraded"
          ? "enclave unreachable"
          : "unconfigured";

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/40 px-3 py-1"
      title={status.message ?? status.enclaveUrl ?? ""}
    >
      <span
        className={`h-2 w-2 rounded-full ${dotClass}`}
        aria-hidden="true"
      />
      <span
        className={`font-mono text-[10px] tracking-[0.2em] uppercase ${labelClass}`}
      >
        {label}
      </span>
    </div>
  );
}
