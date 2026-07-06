'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge, type BadgeProps } from '@/registry/ndeko/ui/badge';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { ringOf, TOP_EM } from './_parts/seal-ring';
import { useHover } from './_parts/use-hover';
import { usePlayWhileSeen } from './_parts/use-play-while-seen';

type RingStyle = React.CSSProperties & { '--r': string };

/** The ring is one turn long at normal speed over this many seconds, and the speed it turns at is a playback rate of it. */
const TURN_SECONDS = 60;

const DEFAULT_SECONDS_PER_TURN = 28;

const TURN_KEYFRAMES: Keyframe[] = [
  { transform: 'rotate(0deg)' },
  { transform: 'rotate(360deg)' },
];

/**
 * The letters stand in a ring that has the size of the seal's text. When a long phrase makes them
 * smaller, the ring is given the smaller text size and the top of the letters is measured in it.
 */
function ringStyleOf(scale: number): RingStyle {
  const size = Math.round(scale * 1000) / 1000;
  const top = Math.round((TOP_EM / size) * 1000) / 1000;
  return { fontSize: `${size}em`, '--r': `${top}em` };
}

function rateOf(secondsPerTurn: number) {
  const isUsable = Number.isFinite(secondsPerTurn) && secondsPerTurn > 0;
  if (!isUsable) {
    return TURN_SECONDS / DEFAULT_SECONDS_PER_TURN;
  }
  return TURN_SECONDS / secondsPerTurn;
}

export type SealProps = {
  /** The line that turns round the ring. It repeats until the ring is full, so a phrase of two to four words fits best. */
  text: string;
  /** The word at the centre, which stays still. Keep it short. */
  label: string;
  /** The colour of the whole seal, one of the colours of a badge. */
  variant?: BadgeProps['variant'];
  /** How long one full turn takes, in seconds. */
  secondsPerTurn?: number;
  /** Stops the ring. It also holds off screen, in a hidden tab, under the pointer and under reduced motion. */
  isTurning?: boolean;
  className?: string;
};

/**
 * A round seal in one colour: a line of text turns slowly round a label that stays still. The ring
 * is one element turned by a transform that the browser runs off the main thread, and it holds
 * wherever nobody can read it, so the seal costs nothing off screen. The seal is read as one image.
 */
export function Seal({
  text,
  label,
  variant = 'default',
  secondsPerTurn = DEFAULT_SECONDS_PER_TURN,
  isTurning = true,
  className,
}: SealProps) {
  const { ref, isPlaying } = usePlayWhileSeen<HTMLSpanElement>();
  const { isHovered, hoverHandlers } = useHover();
  const ringRef = useRef<HTMLSpanElement>(null);
  const turn = useRef<Animation | null>(null);
  const ring = useMemo(() => ringOf(text), [text]);
  const shouldTurn = isPlaying && isTurning && !isHovered;
  const rate = rateOf(secondsPerTurn);

  useEffect(() => {
    const element = ringRef.current;
    if (!element) {
      return;
    }
    const animation = element.animate(TURN_KEYFRAMES, {
      duration: TURN_SECONDS * 1000,
      iterations: Number.POSITIVE_INFINITY,
    });
    animation.pause();
    turn.current = animation;
    return () => {
      animation.cancel();
      turn.current = null;
    };
  }, []);

  useEffect(() => {
    turn.current?.updatePlaybackRate(rate);
  }, [rate]);

  useEffect(() => {
    const animation = turn.current;
    if (!animation) {
      return;
    }
    if (shouldTurn) {
      animation.play();
      return;
    }
    animation.pause();
  }, [shouldTurn]);

  return (
    <span ref={ref} className='inline-flex shrink-0' {...hoverHandlers}>
      <Badge
        variant={variant}
        role='img'
        aria-label={`${label}, ${text}`}
        className={cn(
          'hairline-ring relative size-[11em] overflow-hidden rounded-full p-0 ring-current/25',
          className
        )}
      >
        <span
          ref={ringRef}
          aria-hidden='true'
          style={ringStyleOf(ring.scale)}
          className='absolute inset-0 select-none *:absolute *:top-[calc(50%-var(--r))] *:left-[calc(50%-0.5em)] *:h-(--r) *:w-[1em] *:origin-bottom *:text-center *:leading-none'
        >
          {ring.letters.map((letter, index) => (
            <span key={index} style={{ rotate: `${letter.angle}deg` }}>
              {letter.char}
            </span>
          ))}
        </span>
        <span
          aria-hidden='true'
          className='absolute inset-[2em] rounded-full bg-current/7'
        />
        <span className='relative w-[5.6em] text-center text-[1.15em] leading-tight font-semibold text-balance'>
          {label}
        </span>
      </Badge>
    </span>
  );
}

type Pace = 'calm' | 'quick' | 'paused';

const PACES: Segment<Pace>[] = [
  { value: 'calm', label: 'Calm' },
  { value: 'quick', label: 'Quick' },
  { value: 'paused', label: 'Paused' },
];

const SECONDS_PER_TURN: Record<Pace, number> = {
  calm: 28,
  quick: 9,
  paused: 28,
};

/** Long enough at each pace for the difference to be seen before the demonstration goes round again. */
const CALM_SHOWN_MS = 6000;

const QUICK_SHOWN_MS = 5000;

export default function Badge16() {
  const [pace, setPace] = useState<Pace>('calm');
  const { isHovered, hoverHandlers } = useHover();
  const steps: AutoplayStep[] = [
    { after: CALM_SHOWN_MS, run: () => setPace('quick') },
    { after: QUICK_SHOWN_MS, run: () => setPace('calm') },
  ];
  const { ref } = useAutoplay(steps, {
    loopAfter: 0,
    onReset: () => setPace('calm'),
    isEnabled: !isHovered,
  });
  const isTurning = pace !== 'paused';

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex w-full max-w-[22rem] flex-col items-center gap-5'
      {...hoverHandlers}
    >
      <Seal
        text='Roasted in Goma'
        label='Small batch'
        secondsPerTurn={SECONDS_PER_TURN[pace]}
        isTurning={isTurning}
      />
      <Segments
        value={pace}
        segments={PACES}
        onValueChange={setPace}
        label='Turning pace'
      />
    </div>
  );
}
