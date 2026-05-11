"use client";

import { Suspense, lazy } from "react";

/**
 * B.4 — Spline 3D scene scaffold for /about.
 *
 * Two-step user activation, deliberately gated to avoid bundling ~530KB of
 * Three.js + Spline runtime until you actually want the visual:
 *
 *  1. Install the deps in app/:
 *       npm install @splinetool/react-spline @splinetool/runtime
 *
 *  2. Compose a scene at https://app.spline.design (suggested vibe per
 *     the project plan 7.5.6.b: glowing torus knot, particle inflow/
 *     outflow, dark background). Export the .splinecode URL.
 *
 *  3. Set NEXT_PUBLIC_COMPASS_SPLINE_SCENE_URL=https://prod.spline.design/<id>/scene.splinecode
 *     in Vercel + local app/.env. The component lazy-imports @splinetool/
 *     react-spline only when the env var is set, so until step 1+2+3 are
 *     all done the bundle stays exactly the same size.
 *
 *  4. Render <SplineScene /> wherever the architecture-diagram section
 *     sits on /about.
 *
 * Honors prefers-reduced-motion: the Spline runtime respects the OS
 * setting by default; the wrapper inherits that behavior without extra
 * config.
 *
 * Performance budget per project plan R13: Lighthouse mobile must not drop
 * below 85. If it does after activation, fall back to environmental SVG.
 */

const SPLINE_SCENE_URL = process.env.NEXT_PUBLIC_COMPASS_SPLINE_SCENE_URL;

// Lazy import the Spline runtime ONLY when the env var is set, so a clean
// clone with no .env still builds. Typed as a React component that accepts
// a `scene` URL — matches @splinetool/react-spline's default-export shape.
type SplineRuntimeProps = { scene: string };
type SplineRuntimeComponent = React.ComponentType<SplineRuntimeProps>;

const SplineRuntime = lazy<SplineRuntimeComponent>(() =>
  // @ts-expect-error — module is install-gated; types absent until devDep is added
  import("@splinetool/react-spline").catch(() => ({
    default: (() => (
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4 font-mono text-xs tracking-[0.2em] text-amber-400/80 uppercase">
        Spline scene env-gated and @splinetool/react-spline not installed.
        See app/src/components/about/SplineScene.tsx header for the
        activation steps.
      </div>
    )) satisfies SplineRuntimeComponent,
  })),
);

export function SplineScene({ className = "" }: { className?: string }) {
  if (!SPLINE_SCENE_URL) return null;

  return (
    <div className={`pointer-events-none relative ${className}`}>
      <Suspense
        fallback={
          <div className="flex h-[400px] w-full items-center justify-center rounded-2xl border border-border/40">
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
              loading 3d scene…
            </span>
          </div>
        }
      >
        <div className="pointer-events-auto">
          <SplineRuntime scene={SPLINE_SCENE_URL} />
        </div>
      </Suspense>
    </div>
  );
}
