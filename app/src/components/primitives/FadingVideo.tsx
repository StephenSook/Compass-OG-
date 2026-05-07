"use client";

import { useEffect, useRef } from "react";

type FadingVideoProps = {
  src: string;
  posterSrc?: string;
  objectPosition?: string;
  className?: string;
};

const FADE_MS = 500;

/**
 * Autoplay video with custom rAF fade-in/out at loop boundaries — never
 * CSS transitions on the video element itself. Pattern lifted verbatim
 * from the locked reference set: 500ms fade-in on loadeddata, 500ms
 * fade-out when duration - currentTime <= 0.55, hard reset on ended.
 */
export function FadingVideo({
  src,
  posterSrc,
  objectPosition = "center",
  className = "",
}: FadingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function cancelRaf() {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    function fade(target: number, durationMs: number) {
      cancelRaf();
      if (!video) return;
      const start = performance.now();
      const initial = parseFloat(video.style.opacity || "0");
      const tick = (now: number) => {
        if (!video) return;
        const t = Math.min(1, (now - start) / durationMs);
        video.style.opacity = `${initial + (target - initial) * t}`;
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
        else rafRef.current = null;
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    function onLoadedData() {
      video!.style.opacity = "0";
      fade(1, FADE_MS);
    }

    function onTimeUpdate() {
      if (!video) return;
      const remaining = video.duration - video.currentTime;
      if (Number.isFinite(remaining) && remaining <= 0.55 && remaining > 0) {
        fade(0, FADE_MS);
      }
    }

    function onEnded() {
      if (!video) return;
      cancelRaf();
      video.style.opacity = "0";
      window.setTimeout(() => {
        if (!video) return;
        video.currentTime = 0;
        video.play().catch(() => {});
        fade(1, FADE_MS);
      }, 100);
    }

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    return () => {
      cancelRaf();
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={posterSrc}
      muted
      autoPlay
      playsInline
      preload="auto"
      style={{ opacity: 0, objectPosition }}
      className={`h-full w-full object-cover transition-none ${className}`}
    />
  );
}
