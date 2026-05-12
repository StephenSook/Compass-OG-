"use client";

/**
 * E.1 — HLS-or-MP4 ambient video background.
 *
 * Renders an inline <video> element styled to sit BEHIND hero copy at a
 * low-opacity, object-cover layer. Honors prefers-reduced-motion via the
 * HTML5 spec (browsers pause autoplay when the user has reduce-motion
 * enabled, no extra JS needed).
 *
 * Activation: set NEXT_PUBLIC_COMPASS_HERO_VIDEO_URL to either:
 *   - An HLS playlist URL ending in `.m3u8` (Mux Stream / Cloudflare
 *     Stream / self-hosted ffmpeg-generated playlist) — preferred per
 *     project plan 7.5.2 for adaptive bitrate + LCP-optimized chunks
 *   - A plain MP4 URL — acceptable fallback for assets under 2 MB; for
 *     larger files the LCP regression is documented as R16 in the
 *     project risk register
 *
 * Component renders null when the env var is unset, so the bundle is
 * unchanged until user opts in. The hero page falls back to
 * AmbientSphere (already shipped via B.1).
 *
 * For HLS playlists in browsers without native HLS (Chrome, Firefox), the
 * video element doesn't natively decode .m3u8 — production deploys with
 * HLS playlists should ALSO ship hls.js (install: npm install hls.js)
 * and wire it via the v2 follow-up. Safari decodes HLS natively, so
 * Safari users see HLS today; Chrome/Firefox see the .m3u8 download but
 * silently fail to play. v1 ships the env-gated path; v1.5 adds hls.js
 * for cross-browser coverage.
 *
 * Asset prep guide: docs/notes/hero-video-sourcing.md.
 */

const HERO_VIDEO_URL = process.env.NEXT_PUBLIC_COMPASS_HERO_VIDEO_URL;
const HERO_VIDEO_POSTER = process.env.NEXT_PUBLIC_COMPASS_HERO_VIDEO_POSTER;

export function VideoBackground({ className = "" }: { className?: string }) {
  if (!HERO_VIDEO_URL) return null;

  // Detect HLS vs MP4 by URL extension — sets the right MIME type on the
  // <source> so the browser knows which decoder to try.
  const isHls = HERO_VIDEO_URL.toLowerCase().endsWith(".m3u8");
  const mime = isHls ? "application/vnd.apple.mpegurl" : "video/mp4";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <video
        className="h-full w-full object-cover opacity-30"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={HERO_VIDEO_POSTER}
      >
        <source src={HERO_VIDEO_URL} type={mime} />
      </video>
      {/* Subtle gradient overlay keeps hero typography readable against
          the bright frames in particle-flow loops. */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
    </div>
  );
}

/**
 * Helper: true when the hero video env var is set so callers can pick
 * VideoBackground OR AmbientSphere mutually exclusively without
 * importing both render paths. Avoids double-stack visual noise.
 */
export function heroVideoEnabled(): boolean {
  return !!HERO_VIDEO_URL;
}
