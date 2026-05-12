"use client";

import { useEffect, useRef } from "react";

type FadingVideoProps = {
  src: string;
  posterSrc?: string;
  objectPosition?: string;
  className?: string;
  onPlaybackError?: (err: unknown) => void;
};

const FADE_MS = 500;
// 50ms head-start over FADE_MS so the fade-out completes before `ended`.
const PRE_END_FADE_S = FADE_MS / 1000 + 0.05;

export function FadingVideo({
  src,
  posterSrc,
  objectPosition = "center",
  className = "",
  onPlaybackError,
}: FadingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const fadingOutRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      video.style.opacity = "1";
      return;
    }

    function cancelRaf() {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    function fade(target: number, durationMs: number) {
      cancelRaf();
      const start = performance.now();
      const initialRaw = parseFloat(video!.style.opacity || "0");
      const initial = Number.isFinite(initialRaw) ? initialRaw : 0;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        video!.style.opacity = `${initial + (target - initial) * t}`;
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
      const remaining = video!.duration - video!.currentTime;
      if (
        Number.isFinite(remaining) &&
        remaining > 0 &&
        remaining <= PRE_END_FADE_S &&
        !fadingOutRef.current
      ) {
        fadingOutRef.current = true;
        fade(0, FADE_MS);
      }
    }

    function onEnded() {
      cancelRaf();
      video!.style.opacity = "0";
      fadingOutRef.current = false;
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        video!.currentTime = 0;
        video!.play().catch((err) => {
          if (onPlaybackError) onPlaybackError(err);
          else console.warn("[FadingVideo] loop restart play() rejected", err);
        });
        fade(1, FADE_MS);
      }, 100);
    }

    function onError() {
      // Reveal the poster on source/codec/network failure so users see
      // something instead of an opacity-0 black rectangle forever.
      video!.style.opacity = "1";
      const err = video!.error;
      if (onPlaybackError) onPlaybackError(err);
      else console.error("[FadingVideo] media error", err);
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      onLoadedData();
    }
    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);

    return () => {
      cancelRaf();
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
    };
  }, [src, onPlaybackError]);

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
