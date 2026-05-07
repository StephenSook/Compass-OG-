"use client";

import { motion, useReducedMotion } from "motion/react";

type BlurTextProps = {
  text: string;
  className?: string;
  delayMs?: number;
  staggerMs?: number;
  italicWords?: string[];
};

export function BlurText({
  text,
  className = "",
  delayMs = 0,
  staggerMs = 100,
  italicWords = [],
}: BlurTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const words = text.split(" ");
  const italicSet = new Set(italicWords.map((w) => w.toLowerCase().replace(/[^a-z]/g, "")));

  return (
    <span className={className}>
      {words.map((word, i) => {
        const isItalic = italicSet.has(word.toLowerCase().replace(/[^a-z]/g, ""));
        const wordClass = isItalic ? "inline-block font-serif italic" : "inline-block";
        return (
          <motion.span
            key={`${word}-${i}`}
            className={wordClass}
            initial={
              prefersReducedMotion
                ? false
                : { filter: "blur(10px)", opacity: 0, y: 50 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : {
                    filter: ["blur(10px)", "blur(5px)", "blur(0px)"],
                    opacity: [0, 0.5, 1],
                    y: [50, -5, 0],
                  }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    duration: 0.7,
                    delay: (delayMs + i * staggerMs) / 1000,
                    ease: [0.16, 1, 0.3, 1],
                    times: [0, 0.5, 1],
                  }
            }
          >
            {word}
            {i < words.length - 1 && " "}
          </motion.span>
        );
      })}
    </span>
  );
}
