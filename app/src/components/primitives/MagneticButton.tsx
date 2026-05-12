"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

type MagneticButtonCommonProps = {
  children: ReactNode;
  strength?: number;
  padding?: number;
  className?: string;
  ariaLabel?: string;
};

type MagneticButtonProps =
  | (MagneticButtonCommonProps & { href: string; external?: boolean; onClick?: never })
  | (MagneticButtonCommonProps & { onClick: () => void; href?: never; external?: never });

export function MagneticButton(props: MagneticButtonProps) {
  const {
    children,
    strength = 3,
    padding = 150,
    className = "",
    ariaLabel,
  } = props;
  const isLink = "href" in props && props.href !== undefined;

  const elementRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const safeStrength = Math.max(strength, 0.5);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });

  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = elementRef.current;
    if (!el) return;
    function handleMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      if (Math.hypot(dx, dy) < padding) {
        x.set(dx / safeStrength);
        y.set(dy / safeStrength);
      } else {
        x.set(0);
        y.set(0);
      }
    }
    function handleLeave() {
      x.set(0);
      y.set(0);
    }
    window.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [padding, safeStrength, prefersReducedMotion, x, y, isLink]);

  if (isLink) {
    const { href, external = true } = props;
    return (
      <motion.a
        ref={elementRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        target={external ? "_blank" : "_self"}
        rel={external ? "noopener noreferrer" : undefined}
        aria-label={ariaLabel}
        className={`inline-block focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-4 ${className}`}
        style={{ x: sx, y: sy }}
      >
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button
      ref={elementRef as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={props.onClick}
      aria-label={ariaLabel}
      className={`inline-block focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-4 ${className}`}
      style={{ x: sx, y: sy }}
    >
      {children}
    </motion.button>
  );
}
