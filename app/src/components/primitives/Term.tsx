"use client";

import { ReactNode } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { GLOSSARY } from "@/lib/glossary";

// <Term> wraps a technical term with an accessible tooltip showing a
// plain-language definition. Powered by Radix Tooltip — keyboard-
// focusable, screen-reader-announced via aria-describedby, dismisses on
// Escape, portal-mounted so it sits above all stacking contexts.
//
// Usage:
//   <Term k="sd-jwt-vc">SD-JWT VC</Term>
//
// Custom display text:
//   <Term k="sd-jwt-vc">verifiable credentials</Term>
//
// The `k` prop must match a key in `app/src/lib/glossary.ts`. If the
// key is missing the component still renders the children as a plain
// span (no underline, no tooltip) so missing definitions don't break
// the page; check the dev console for a warning during development.

type TermProps = {
  k: keyof typeof GLOSSARY;
  children?: ReactNode;
};

export function Term({ k, children }: TermProps) {
  const entry = GLOSSARY[k];
  if (!entry) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(`[Term] Unknown glossary key "${k}"`);
    }
    return <span>{children}</span>;
  }

  const label = children ?? entry.term;

  return (
    <Tooltip.Root delayDuration={150}>
      <Tooltip.Trigger asChild>
        <span
          tabIndex={0}
          className="decoration-foreground/30 hover:decoration-foreground/60 focus:decoration-foreground/60 cursor-help underline decoration-dotted decoration-from-font underline-offset-4 outline-none transition-colors focus:outline-none"
        >
          {label}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          align="center"
          sideOffset={6}
          className="z-50 max-w-xs rounded-lg border border-border/60 bg-card/95 p-3 text-xs leading-relaxed text-muted-foreground shadow-xl backdrop-blur-sm"
        >
          <div className="font-mono text-[10px] tracking-[0.2em] text-foreground/80 uppercase">
            {entry.term}
          </div>
          <div className="mt-1.5">{entry.definition}</div>
          {entry.link ? (
            <a
              href={entry.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex text-[10px] tracking-[0.2em] text-foreground/60 uppercase underline-offset-2 hover:underline"
            >
              Source ↗
            </a>
          ) : null}
          <Tooltip.Arrow className="fill-card" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function TermProvider({ children }: { children: ReactNode }) {
  return <Tooltip.Provider delayDuration={150}>{children}</Tooltip.Provider>;
}
