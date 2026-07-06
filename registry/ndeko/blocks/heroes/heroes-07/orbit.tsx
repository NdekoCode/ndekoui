'use client';

import { useInView } from 'motion/react';
import { type CSSProperties, useRef } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';

import { INNER_RING, OUTER_RING, type Ring } from './data';

const FULL_TURN = 360;

const RING_SIZE: Record<Ring['id'], string> = {
  outer: 'w-[min(35rem,calc(100cqw_-_2.5rem))]',
  inner: 'w-[min(24rem,calc(68.5cqw_-_1.7rem))]',
};

function placeOf(index: number, count: number, startDegrees: number) {
  const degrees = startDegrees + (FULL_TURN / count) * index;
  const radians = (degrees * Math.PI) / 180;
  const left = 50 + 50 * Math.cos(radians);
  const top = 50 + 50 * Math.sin(radians);
  const place: CSSProperties = {
    left: `${left.toFixed(1)}%`,
    top: `${top.toFixed(1)}%`,
  };
  return place;
}

function directionOf(isReversed: boolean) {
  if (isReversed) {
    return 'reverse';
  }
  return 'normal';
}

function playStateOf(isPlaying: boolean) {
  if (isPlaying) {
    return 'running';
  }
  return 'paused';
}

function spinClassOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return undefined;
  }
  return 'animate-spin';
}

type SpinOptions = {
  seconds: number;
  isReversed: boolean;
  isPlaying: boolean;
};

function spinStyleOf({ seconds, isReversed, isPlaying }: SpinOptions) {
  const style: CSSProperties = {
    animationDuration: `${seconds}s`,
    animationDirection: directionOf(isReversed),
    animationPlayState: playStateOf(isPlaying),
  };
  return style;
}

type RingViewProps = {
  ring: Ring;
  isPlaying: boolean;
  shouldReduceMotion: boolean;
};

/** The circle turns one way and each tile turns back the other way at the same speed, so the marks stay upright. */
function RingView({ ring, isPlaying, shouldReduceMotion }: RingViewProps) {
  const spinClass = spinClassOf(shouldReduceMotion);
  const ringStyle = spinStyleOf({
    seconds: ring.turnSeconds,
    isReversed: ring.isReversed,
    isPlaying,
  });
  const tileStyle = spinStyleOf({
    seconds: ring.turnSeconds,
    isReversed: !ring.isReversed,
    isPlaying,
  });
  const count = ring.apps.length;

  return (
    <div
      style={ringStyle}
      className={cn(
        'border-foreground/15 absolute top-1/2 left-1/2 aspect-square -translate-1/2 rounded-full border border-dashed',
        RING_SIZE[ring.id],
        spinClass
      )}
    >
      {ring.apps.map((app, index) => (
        <span
          key={app.id}
          style={placeOf(index, count, ring.startDegrees)}
          className='absolute -translate-x-1/2 -translate-y-1/2'
        >
          <span style={tileStyle} className={cn('block', spinClass)}>
            <BrandTile brand={app.brand} size='2xl' />
          </span>
        </span>
      ))}
    </div>
  );
}

export function Orbit() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: 0.1 });
  const isVisible = useDocumentVisible();
  const shouldReduceMotion = usePrefersReducedMotion();
  const isPlaying = isInView && isVisible;

  return (
    <div ref={ref} aria-hidden='true' className='absolute inset-0'>
      <RingView
        ring={OUTER_RING}
        isPlaying={isPlaying}
        shouldReduceMotion={shouldReduceMotion}
      />
      <RingView
        ring={INNER_RING}
        isPlaying={isPlaying}
        shouldReduceMotion={shouldReduceMotion}
      />
    </div>
  );
}
