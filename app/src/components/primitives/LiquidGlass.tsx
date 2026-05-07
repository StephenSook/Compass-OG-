import { type ReactNode } from "react";

type LiquidGlassProps = {
  children?: ReactNode;
  radius?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
};

const radiusMap: Record<NonNullable<LiquidGlassProps["radius"]>, string> = {
  sm: "rounded-md",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  full: "rounded-full",
};

export function LiquidGlass({
  children,
  radius = "lg",
  className = "",
}: LiquidGlassProps) {
  return (
    <div className={`liquid-glass ${radiusMap[radius]} ${className}`}>
      {children}
    </div>
  );
}
