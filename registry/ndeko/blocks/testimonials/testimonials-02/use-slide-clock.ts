'use client';

import { useEffect, useEffectEvent, useRef, type RefObject } from 'react';

const FILL: Keyframe[] = [
  { transform: 'scaleX(0)' },
  { transform: 'scaleX(1)' },
];

type SlideClockOptions = {
  /** A new key starts a new fill: the slide changed. */
  slideKey: string;
  isRotating: boolean;
  /** False while the rotation is held: the fill stops where it is and goes on from there. */
  isRunning: boolean;
  durationMs: number;
  onEnd: () => void;
};

/**
 * The time a slide has left is the fill of its bar: a Web Animation on the compositor, so a slide
 * that waits costs no script at all, and a held one costs nothing. Its end moves the carousel on.
 */
export function useSlideClock<Fill extends HTMLElement>(
  fillRef: RefObject<Fill | null>,
  { slideKey, isRotating, isRunning, durationMs, onEnd }: SlideClockOptions
) {
  const animationRef = useRef<Animation | null>(null);
  const end = useEffectEvent(onEnd);

  useEffect(() => {
    const fill = fillRef.current;
    if (!fill || !isRotating) {
      return;
    }
    const animation = fill.animate(FILL, {
      duration: durationMs,
      easing: 'linear',
      fill: 'forwards',
    });
    animation.pause();
    animation.onfinish = () => end();
    animationRef.current = animation;
    return () => {
      animation.onfinish = null;
      animation.cancel();
      animationRef.current = null;
    };
  }, [fillRef, slideKey, isRotating, durationMs]);

  useEffect(() => {
    const animation = animationRef.current;
    if (!animation) {
      return;
    }
    const isPaused = animation.playState === 'paused';
    const isPlaying = animation.playState === 'running';
    if (isRunning && isPaused) {
      animation.play();
      return;
    }
    if (!isRunning && isPlaying) {
      animation.pause();
    }
  }, [isRunning, slideKey, isRotating]);
}
