'use client';

import { useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { speechLevelAt } from '@/registry/ndeko/lib/speech-envelope';

const SAMPLE_EVERY_MS = 70;

const FLOOR = 0.16;

/** How much of the gap to the target intensity is closed on each frame, so silence settles instead of snapping. */
const INTENSITY_EASING = 0.12;

function restingScaleOf(index: number, seed: number) {
  const sampleTime = index * 140;
  const level = speechLevelAt(sampleTime, seed + 1.3);
  return Math.max(FLOOR, level);
}

function restingStyleOf(index: number, seed: number) {
  const scale = restingScaleOf(index, seed);
  return { transform: `scaleY(${scale})` };
}

function barsOf(container: HTMLElement) {
  const children = Array.from(container.children);
  return children.filter((child) => child instanceof HTMLElement);
}

function paint(bars: HTMLElement[], samples: number[]) {
  bars.forEach((bar, index) => {
    const sample = samples[index] ?? FLOOR;
    bar.style.transform = `scaleY(${sample})`;
  });
}

type LevelBarsProps = {
  isActive: boolean;
  /** Scales the simulated voice: 1 while someone speaks, near 0 in silence. */
  intensity?: number;
  /** A live level between 0 and 1, such as a microphone analyser. Left out, a simulated voice drives the bars. */
  level?: () => number;
  count?: number;
  seed?: number;
  className?: string;
  barClassName?: string;
};

/** Frames are painted through the DOM, so React never re-renders per frame. */
export function LevelBars({
  isActive,
  intensity = 1,
  level,
  count = 16,
  seed = 0,
  className,
  barClassName,
}: LevelBarsProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const intensityRef = useRef(intensity);
  const levelRef = useRef(level);
  const shouldReduceMotion = useReducedMotion();
  const indexes = Array.from({ length: count }, (_, index) => index);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const shouldAnimate = isActive && !shouldReduceMotion;
    if (!shouldAnimate) {
      return;
    }
    const bars = barsOf(container);
    const samples = bars.map((_, index) => restingScaleOf(index, seed));
    const startedAt = performance.now();
    let currentIntensity = intensityRef.current;
    let lastSampleAt = -Infinity;
    let frame = 0;

    function sampleAt(now: number) {
      const provider = levelRef.current;
      if (provider) {
        return provider();
      }
      const elapsed = now - startedAt;
      const simulated = speechLevelAt(elapsed, seed);
      return simulated * currentIntensity;
    }

    function draw(now: number) {
      const gap = intensityRef.current - currentIntensity;
      currentIntensity += gap * INTENSITY_EASING;
      const sinceSample = now - lastSampleAt;
      const isDue = sinceSample >= SAMPLE_EVERY_MS;
      if (isDue) {
        lastSampleAt = now;
        const sample = sampleAt(now);
        samples.shift();
        samples.push(Math.max(FLOOR, sample));
        paint(bars, samples);
      }
      frame = requestAnimationFrame(draw);
    }

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [isActive, shouldReduceMotion, seed]);

  return (
    <span
      ref={containerRef}
      aria-hidden='true'
      className={cn('flex h-5 items-center gap-[3px]', className)}
    >
      {indexes.map((index) => (
        <span
          key={index}
          style={restingStyleOf(index, seed)}
          className={cn(
            'bg-primary h-full w-[3px] shrink-0 rounded-full transition-transform duration-75 ease-linear',
            barClassName
          )}
        />
      ))}
    </span>
  );
}
