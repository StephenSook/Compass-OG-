import { type HTMLAttributes, type ReactNode } from "react";

type LiquidGlassProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  radius?: "sm" | "md" | "lg" | "xl" | "full";
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
  ...rest
}: LiquidGlassProps) {
  return (
    <div className={`liquid-glass ${radiusMap[radius]} ${className}`} {...rest}>
      {children}
    </div>
  );
}
