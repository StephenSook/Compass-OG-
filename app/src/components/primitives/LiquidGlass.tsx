import { type ReactNode } from "react";

type LiquidGlassProps = {
  children?: ReactNode;
  radius?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
};

const radiusMap: Record<NonNullable<LiquidGlassProps["radius"]>, string> = {
  sm: "rounded-md",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  full: "rounded-full",
};

const GLASS_BASE =
  "liquid-glass-border bg-white/[0.02] backdrop-blur-md backdrop-saturate-150 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]";

export function LiquidGlass({
  children,
  radius = "lg",
  className = "",
  "aria-hidden": ariaHidden,
}: LiquidGlassProps) {
  return (
    <div
      aria-hidden={ariaHidden}
      className={`${GLASS_BASE} ${radiusMap[radius]} ${className}`}
    >
      {children}
    </div>
  );
}
