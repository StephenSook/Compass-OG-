"use client";

import { useReducedMotion } from "motion/react";

/**
 * Decorative inline SVG ambient — translucent sphere with light particles
 * flowing inward (commitments) and one bright particle flowing outward (the
 * non-identifying receipt). Sits behind the hero copy on / and /vault as a
 * subtle visual anchor.
 *
 * Pure SVG + CSS — no image assets, no external network calls, no Banana
 * round-trip. The pattern is deterministic and small (<3KB rendered) so
 * adding it doesn't move LCP/CLS.
 *
 * Honors prefers-reduced-motion: the orbiting particles freeze when the OS
 * setting is on; the sphere stays.
 */
export function AmbientSphere({
  className = "",
  size = 520,
}: {
  className?: string;
  size?: number;
}) {
  const reduced = useReducedMotion();
  const particleAnimation = reduced ? undefined : "particle-orbit 18s linear infinite";
  const inwardAnimation = reduced ? undefined : "particle-inflow 6s ease-in infinite";
  const outwardAnimation = reduced ? undefined : "particle-outflow 7s ease-out infinite";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 600"
      width={size}
      height={size}
      className={`pointer-events-none ${className}`}
    >
      <defs>
        <radialGradient id="ambient-sphere-fill" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="50%" stopColor="rgba(180,200,240,0.04)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <radialGradient id="ambient-sphere-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(160,200,255,0.18)" />
          <stop offset="60%" stopColor="rgba(160,200,255,0.04)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* outer glow */}
      <circle cx="300" cy="300" r="280" fill="url(#ambient-sphere-glow)" />
      {/* sphere body */}
      <circle cx="300" cy="300" r="200" fill="url(#ambient-sphere-fill)" />
      {/* sphere outline */}
      <circle
        cx="300"
        cy="300"
        r="200"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />

      {/* inward particles — commitments flowing in */}
      <g opacity="0.5" style={{ animation: inwardAnimation }}>
        <circle cx="80" cy="240" r="2" fill="rgba(180,210,255,0.8)" />
        <circle cx="100" cy="320" r="1.5" fill="rgba(180,210,255,0.6)" />
        <circle cx="60" cy="380" r="1" fill="rgba(180,210,255,0.5)" />
      </g>

      {/* outward particle — the single non-identifying receipt */}
      <circle
        cx="540"
        cy="300"
        r="3"
        fill="rgba(255,255,255,0.95)"
        style={{ animation: outwardAnimation }}
      />

      {/* orbiting markers around the sphere edge */}
      <g
        style={{
          animation: particleAnimation,
          transformOrigin: "300px 300px",
        }}
      >
        <circle cx="300" cy="100" r="2" fill="rgba(255,255,255,0.5)" />
        <circle cx="500" cy="300" r="1.5" fill="rgba(255,255,255,0.35)" />
        <circle cx="300" cy="500" r="2" fill="rgba(255,255,255,0.5)" />
        <circle cx="100" cy="300" r="1.5" fill="rgba(255,255,255,0.35)" />
      </g>

      <style>{`
        @keyframes particle-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes particle-inflow {
          0% { transform: translateX(0); opacity: 0; }
          50% { transform: translateX(120px); opacity: 0.6; }
          100% { transform: translateX(220px); opacity: 0; }
        }
        @keyframes particle-outflow {
          0% { transform: translateX(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateX(60px); opacity: 0; }
        }
      `}</style>
    </svg>
  );
}
