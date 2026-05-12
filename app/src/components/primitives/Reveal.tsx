"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

// Scroll-driven reveal. Wraps any node; fades + slides into place when
// it enters the viewport. Pure IntersectionObserver — no animation
// library. Honors prefers-reduced-motion: motion-sensitive visitors get
// the content fully visible from the first render.
//
// Usage:
//   <Reveal>...</Reveal>
//   <Reveal delay={120}>...</Reveal>
//
// Tune the threshold + delay sparingly. Default threshold 0.15 (15% of
// the node visible before reveal) feels right for most content blocks.

type RevealProps = {
  children: ReactNode;
  delay?: number;
  threshold?: number;
  className?: string;
};

export function Reveal({
  children,
  delay = 0,
  threshold = 0.15,
  className = "",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduced(true);
      setShown(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: reduced ? undefined : `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}
