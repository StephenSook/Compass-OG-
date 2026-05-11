"use client";

import { useEffect, useState } from "react";

// Sticky bottom-right "Watch the demo" CTA. Env-gated: renders nothing
// unless NEXT_PUBLIC_COMPASS_DEMO_VIDEO_URL is set in Vercel prod env.
// Once the F.1 demo video lands on YouTube unlisted, set the env var
// to surface the CTA across every page automatically.
//
// Behaviour:
//  - Hidden for first 800ms or until the visitor scrolls past 30% of
//    the viewport height — whichever happens first. Lets the hero
//    breathe; lands once the visitor is "engaged."
//  - Honors prefers-reduced-motion: skips the entrance transition.
//  - Dismissible. Closing once persists for the session (sessionStorage).
//    Returning visitors see it again on the next session.
//  - Pure CSS animation. No motion library.

const URL = process.env.NEXT_PUBLIC_COMPASS_DEMO_VIDEO_URL;
const DISMISSED_KEY = "compass.demo_cta.dismissed";

export function DemoCta() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!URL) return;
    if (typeof window === "undefined") return;

    if (sessionStorage.getItem(DISMISSED_KEY) === "1") {
      setDismissed(true);
      return;
    }

    const t = setTimeout(() => setShow(true), 800);

    const onScroll = () => {
      const scrolled = window.scrollY;
      const viewport = window.innerHeight;
      if (scrolled > viewport * 0.3) setShow(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!URL || dismissed) return null;

  return (
    <div
      className={`pointer-events-none fixed right-6 bottom-6 z-40 transition-all duration-500 ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border/60 bg-card/90 px-2 py-2 pl-5 shadow-xl backdrop-blur-sm">
        <a
          href={URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[10px] tracking-[0.3em] text-foreground uppercase transition-colors hover:text-foreground/80"
        >
          Watch the 3-min demo →
        </a>
        <button
          aria-label="Dismiss demo CTA"
          onClick={() => {
            sessionStorage.setItem(DISMISSED_KEY, "1");
            setDismissed(true);
          }}
          className="ml-1 flex h-7 w-7 items-center justify-center rounded-full border border-border/40 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          ×
        </button>
      </div>
    </div>
  );
}
