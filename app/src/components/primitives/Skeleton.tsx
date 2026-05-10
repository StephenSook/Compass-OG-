"use client";

import { useReducedMotion } from "motion/react";

/**
 * Generic shimmer-block placeholder used while a client island hydrates from
 * localStorage / IndexedDB / a network fetch. Pure CSS animation; honors
 * prefers-reduced-motion by freezing the gradient.
 *
 * Use case: prevent layout shift when the real content finally loads. Match
 * the dimensions of the live content as closely as possible — these are
 * structural placeholders, not decorative.
 */
export function Skeleton({
  className = "",
  ariaLabel,
}: {
  className?: string;
  ariaLabel?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <div
      role="status"
      aria-label={ariaLabel ?? "loading"}
      aria-busy="true"
      className={`relative overflow-hidden rounded-md bg-foreground/5 ${className}`}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
          animation: reduced ? undefined : "compass-skeleton-shimmer 1.6s linear infinite",
        }}
      />
      <style>{`
        @keyframes compass-skeleton-shimmer {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

/**
 * Pre-styled card skeleton matching the LiveCredentialList card shape so the
 * /vault hydration handoff is layout-shift-free.
 */
export function CredentialCardSkeleton() {
  return (
    <article className="rounded-2xl border border-foreground/10 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-48" ariaLabel="loading vct" />
          <Skeleton className="h-6 w-72" ariaLabel="loading title" />
          <Skeleton className="h-3 w-96 max-w-full" ariaLabel="loading issuer did" />
        </div>
        <Skeleton className="h-7 w-16" ariaLabel="loading status" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-32" ariaLabel="loading claim group" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10 md:col-span-2" />
      </div>
    </article>
  );
}
