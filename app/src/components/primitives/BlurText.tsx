"use client";

import { motion } from "motion/react";

type BlurTextProps = {
  text: string;
  className?: string;
  delay?: number;
  staggerMs?: number;
};

export function BlurText({
  text,
  className = "",
  delay = 0,
  staggerMs = 100,
}: BlurTextProps) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block"
          initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
          animate={{
            filter: ["blur(10px)", "blur(5px)", "blur(0px)"],
            opacity: [0, 0.5, 1],
            y: [50, -5, 0],
          }}
          transition={{
            duration: 0.7,
            delay: delay + (i * staggerMs) / 1000,
            ease: [0.16, 1, 0.3, 1],
            times: [0, 0.5, 1],
          }}
        >
          {word}
          {i < words.length - 1 && " "}
        </motion.span>
      ))}
    </span>
  );
}
