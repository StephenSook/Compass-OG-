"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

type RevealTextProps = {
  /** Plain text only — JSX cannot be split per char by design. */
  text: string;
  className?: string;
};

export function RevealText({ text, className = "" }: RevealTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [hasScroll, setHasScroll] = useState(true);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.2"],
  });

  useEffect(() => {
    setMounted(true);
    const check = () => setHasScroll(document.body.scrollHeight > window.innerHeight + 50);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Always render the wrapper span with ref attached so useScroll has a
  // stable target. Conditionally render the inner content: plain text on
  // SSR / reduced-motion / no-scroll viewport, per-char motion otherwise.
  const useMotion = mounted && !prefersReducedMotion && hasScroll;
  const chars = useMotion ? Array.from(text) : null;

  return (
    <span ref={ref} className={className} aria-label={text}>
      {chars ? (
        chars.map((ch, i) => (
          <Char key={i} index={i} total={chars.length} progress={scrollYProgress}>
            {ch}
          </Char>
        ))
      ) : (
        <span aria-hidden="true">{text}</span>
      )}
    </span>
  );
}

type CharProps = {
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  children: string;
};

function Char({ index, total, progress, children }: CharProps) {
  const start = index / total;
  const end = (index + 1) / total;
  const opacity = useTransform(progress, [start, end], [0.15, 1]);
  return (
    <motion.span
      aria-hidden="true"
      style={{ opacity }}
      className={children === " " ? "" : "inline-block"}
    >
      {children === " " ? " " : children}
    </motion.span>
  );
}
