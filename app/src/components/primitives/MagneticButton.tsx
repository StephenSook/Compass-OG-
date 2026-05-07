"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

type MagneticButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  strength?: number;
  padding?: number;
  className?: string;
};

export function MagneticButton({
  children,
  href,
  onClick,
  strength = 3,
  padding = 150,
  className = "",
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const [transform, setTransform] = useState("translate3d(0,0,0)");
  const [transition, setTransition] = useState("transform 0.6s ease-in-out");
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = ref.current;
    if (!el) return;

    function handleMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const distance = Math.hypot(dx, dy);
      if (distance < padding) {
        setTransition("transform 0.3s ease-out");
        setTransform(`translate3d(${dx / strength}px, ${dy / strength}px, 0)`);
      } else {
        setTransition("transform 0.6s ease-in-out");
        setTransform("translate3d(0,0,0)");
      }
    }
    function handleLeave() {
      setTransition("transform 0.6s ease-in-out");
      setTransform("translate3d(0,0,0)");
    }

    window.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [padding, strength, prefersReducedMotion]);

  const style = { transform, transition };

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-block ${className}`}
        style={style}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      className={`inline-block ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}
