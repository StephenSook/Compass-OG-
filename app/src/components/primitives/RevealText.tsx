"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

type RevealTextProps = {
  text: string;
  className?: string;
};

export function RevealText({ text, className = "" }: RevealTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.2"],
  });

  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>;
  }

  const chars = Array.from(text);
  return (
    <span ref={ref} className={className}>
      {chars.map((ch, i) => (
        <Char key={i} index={i} total={chars.length} progress={scrollYProgress}>
          {ch}
        </Char>
      ))}
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
    <motion.span style={{ opacity }} className={children === " " ? "" : "inline-block"}>
      {children === " " ? " " : children}
    </motion.span>
  );
}
