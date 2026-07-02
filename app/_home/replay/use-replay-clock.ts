'use client';

import { useEffect, useState } from 'react';

import { usePrefersReducedMotion } from '../use-prefers-reduced-motion';

/** A tab put in the background stops the frames; on its return the replay resumes, it does not jump. */
const LONGEST_FRAME_MS = 100;

const IN_VIEW_SHARE = 0.35;

type ReplayClock = {
  elapsed: number;
  isPlaying: boolean;
  /** With reduced motion the replay never runs: each chapter shows its last frame. */
  isStill: boolean;
  setStage: (node: HTMLElement | null) => void;
  togglePlaying: () => void;
  seek: (ms: number) => void;
};

function useIsInView(node: HTMLElement | null) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: IN_VIEW_SHARE }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return isInView;
}

/** The time of the replay. It runs while the stage is on screen and loops at the end. */
export function useReplayClock(totalMs: number): ReplayClock {
  const isStill = usePrefersReducedMotion();
  const [stage, setStage] = useState<HTMLElement | null>(null);
  const isInView = useIsInView(stage);
  const [elapsed, setElapsed] = useState(0);
  const [stillElapsed, setStillElapsed] = useState(totalMs - 1);
  const [isPausedByViewer, setIsPausedByViewer] = useState(false);
  const isPlaying = !isPausedByViewer && !isStill;
  const isRunning = isPlaying && isInView;

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    let frame = 0;
    let last = performance.now();

    function tick(now: number) {
      const frameMs = Math.min(now - last, LONGEST_FRAME_MS);
      last = now;
      setElapsed((current) => (current + frameMs) % totalMs);
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isRunning, totalMs]);

  function togglePlaying() {
    setIsPausedByViewer((current) => !current);
  }

  function seek(ms: number) {
    if (isStill) {
      setStillElapsed(ms);
      return;
    }
    setElapsed(ms);
  }

  let shownElapsed = elapsed;
  if (isStill) {
    shownElapsed = stillElapsed;
  }

  return {
    elapsed: shownElapsed,
    isPlaying,
    isStill,
    setStage,
    togglePlaying,
    seek,
  };
}
