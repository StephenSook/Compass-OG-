"use client";

import { motion, useReducedMotion } from "motion/react";
import { GLASS_BASE } from "./LiquidGlass";

type TEEStatus = "verified" | "pending" | "expired" | "revoked";

type TEEBadgeProps = {
  status?: TEEStatus;
  label?: string;
};

const STATUS_COPY: Record<TEEStatus, string> = {
  verified: "TEE Verified",
  pending: "TEE Pending",
  expired: "TEE Expired",
  revoked: "TEE Revoked",
};

const STATUS_TONE: Record<TEEStatus, { dot: string; pulse: boolean }> = {
  verified: { dot: "bg-accent", pulse: true },
  pending: { dot: "bg-accent", pulse: true },
  expired: { dot: "bg-muted-foreground/60", pulse: false },
  revoked: { dot: "bg-red-500", pulse: false },
};

export function TEEBadge({ status = "verified", label }: TEEBadgeProps) {
  const prefersReducedMotion = useReducedMotion();
  const tone = STATUS_TONE[status];
  const text = label ?? STATUS_COPY[status];

  return (
    <span className={`inline-flex items-center gap-2 ${GLASS_BASE} rounded-full px-4 py-1.5`}>
      <motion.span
        className={`h-1.5 w-1.5 rounded-full ${tone.dot}`}
        initial={prefersReducedMotion || !tone.pulse ? false : { opacity: 0.4 }}
        animate={
          prefersReducedMotion || !tone.pulse
            ? { opacity: 1 }
            : { opacity: [0.4, 1, 0.4] }
        }
        transition={
          prefersReducedMotion || !tone.pulse
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
