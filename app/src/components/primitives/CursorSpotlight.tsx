"use client";

import { useEffect, useRef } from "react";

// Cursor-follow radial spotlight. A faint white radial gradient that
// follows the pointer across the dark background. Pure CSS + a tiny JS
// listener — no WebGL, no library. Mounted at root layout so every
// dark-themed page gets the depth treatment automatically.
//
// Performance:
//  - Single layered <div> with z-[-1] so it never intercepts pointer
//    events.
//  - Style mutations via CSS variables (--x, --y) — no React re-render
//    on each mousemove tick.
//  - Honors prefers-reduced-motion: the listener is registered only
//    when the user has NOT set reduce-motion, so motion-sensitive
//    visitors get a static background.
//  - Defaults to centered position if JS doesn't run / before first
//    mousemove, so the radial still renders during SSR + cold paint.
export function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const handle = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      el.style.setProperty("--x", `${e.clientX}px`);
      el.style.setProperty("--y", `${e.clientY}px`);
    };

    window.addEventListener("pointermove", handle, { passive: true });
    return () => window.removeEventListener("pointermove", handle);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          "radial-gradient(420px circle at var(--x, 50%) var(--y, 50%), rgba(255,255,255,0.045), transparent 45%)",
        transition: "background 50ms linear",
      }}
    />
  );
}
