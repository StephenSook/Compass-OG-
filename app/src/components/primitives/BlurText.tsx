"use client";

import { Fragment } from "react";
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
        // First word skips the blur stagger so Chrome's LCP picker counts
        // it on the first paint instead of waiting for opacity > 0.
        const skipAnim = prefersReducedMotion || i === 0;
        return (
          <Fragment key={`${word}-${i}`}>
            <motion.span
              className={wordClass}
              initial={
                skipAnim
                  ? false
                  : { filter: "blur(10px)", opacity: 0, y: 50 }
              }
              animate={
                skipAnim
                  ? { opacity: 1 }
                  : {
                      filter: ["blur(10px)", "blur(5px)", "blur(0px)"],
                      opacity: [0, 0.5, 1],
                      y: [50, -5, 0],
                    }
              }
              transition={
                skipAnim
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
            </motion.span>
            {i < words.length - 1 && " "}
          </Fragment>
        );
      })}
    </span>
  );
}
