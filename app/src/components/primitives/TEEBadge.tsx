"use client";

import { motion, useReducedMotion } from "motion/react";

type TEEBadgeProps = {
  status?: "verified" | "pending";
  label?: string;
};

export function TEEBadge({ status = "verified", label }: TEEBadgeProps) {
  const prefersReducedMotion = useReducedMotion();
  const text = label ?? (status === "verified" ? "TEE Verified" : "TEE Pending");

  return (
    <span className="inline-flex items-center gap-2 liquid-glass-border bg-white/[0.02] backdrop-blur-md backdrop-saturate-150 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] rounded-full px-4 py-1.5">
      <motion.span
        className="h-1.5 w-1.5 rounded-full bg-accent"
        initial={prefersReducedMotion ? false : { opacity: 0.4 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: [0.4, 1, 0.4] }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <span className="font-mono text-[10px] tracking-[0.3em] text-foreground uppercase">
        {text}
      </span>
    </span>
  );
}
