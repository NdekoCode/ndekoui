'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { cn } from '@/registry/ndeko/lib/utils';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { useHover } from './_parts/use-hover';
import { usePlayWhileSeen } from './_parts/use-play-while-seen';

export type SwapDirection = 'up' | 'down';

type Tilt = {
  away: string;
  toward: string;
};

const DEFAULT_HOLD_MS = 2600;

const TURN_MS = 640;

const TURN_EASING = 'cubic-bezier(0.77, 0, 0.175, 1)';

/** The two phrases are faces of one drum: they turn round an axis this far behind the line, so they stay a quarter turn apart. */
const AXIS = '50% 50% -0.6em';

const PERSPECTIVE = '30em';

const SHARP = 'blur(0px)';

const BLURRED = 'blur(2px)';

/** The leaving phrase is gone by this share of the turn and the arriving one starts to show after the matching share, so the two never read as one smear. */
const LEAVES_BY = 0.6;

const ARRIVES_FROM = 0.4;

const TILTS: Record<SwapDirection, Tilt> = {
  up: { away: 'rotateX(90deg)', toward: 'rotateX(-90deg)' },
  down: { away: 'rotateX(-90deg)', toward: 'rotateX(90deg)' },
};

function nextIndexOf(current: number, count: number) {
  return (current + 1) % count;
}

function leaveKeyframesOf(direction: SwapDirection): Keyframe[] {
  const { away } = TILTS[direction];
  return [
    { transform: 'rotateX(0deg)', opacity: 1, filter: SHARP },
    { offset: LEAVES_BY, opacity: 0 },
    { transform: away, opacity: 0, filter: BLURRED },
  ];
}

function arriveKeyframesOf(direction: SwapDirection): Keyframe[] {
  const { toward } = TILTS[direction];
  return [
    { transform: toward, opacity: 0, filter: BLURRED },
    { offset: ARRIVES_FROM, opacity: 0 },
    { transform: 'rotateX(0deg)', opacity: 1, filter: SHARP },
  ];
}

export type PerspectiveSwapProps = {
  /** The phrases the headline goes through, two or three of them. */
  phrases: readonly string[];
  /** Which way the phrase that leaves turns: `up` tips its top edge away, `down` its bottom edge. */
  direction?: SwapDirection;
  /** How long a phrase rests before the next one turns in, in milliseconds. */
  holdMs?: number;
  /** What a screen reader reads in place of the phrases. */
  label?: string;
  className?: string;
};

/**
 * A headline that alternates between phrases. Each one turns away round an axis behind the line
 * while the next turns in from the other side, in soft perspective. The phrases share one box, so
 * the headline keeps the size of the longest and nothing under it moves. It holds under the
 * pointer, off screen and in a hidden tab, and under reduced motion it rests on the first phrase.
 */
export function PerspectiveSwap({
  phrases,
  direction = 'up',
  holdMs = DEFAULT_HOLD_MS,
  label,
  className,
}: PerspectiveSwapProps) {
  const { ref, isPlaying, isStill } = usePlayWhileSeen<HTMLSpanElement>();
  const { isHovered, hoverHandlers } = useHover();
  const [index, setIndex] = useState(0);
  const faces = useRef<(HTMLSpanElement | null)[]>([]);
  const lastShown = useRef(0);
  const count = phrases.length;
  const hasSeveral = count > 1;
  const canTurn = isPlaying && hasSeveral;
  const isTurning = canTurn && !isHovered;
  const shown = index % Math.max(count, 1);
  const spoken = label ?? phrases.join(', ');

  useEffect(() => {
    if (!isTurning) {
      return;
    }
    const timer = window.setTimeout(() => {
      setIndex((current) => nextIndexOf(current, count));
    }, holdMs);
    return () => window.clearTimeout(timer);
  }, [isTurning, index, count, holdMs]);

  useLayoutEffect(() => {
    const previous = lastShown.current;
    lastShown.current = shown;
    const hasTurned = previous !== shown;
    if (!hasTurned || isStill) {
      return;
    }
    const leaving = faces.current[previous];
    const arriving = faces.current[shown];
    if (!leaving || !arriving) {
      return;
    }
    const timing = { duration: TURN_MS, easing: TURN_EASING };
    leaving.animate(leaveKeyframesOf(direction), timing);
    arriving.animate(arriveKeyframesOf(direction), timing);
  }, [shown, direction, isStill]);

  if (count === 0) {
    return null;
  }

  return (
    <span
      ref={ref}
      style={{ perspective: PERSPECTIVE }}
      className={cn(
        'relative -mx-[0.1em] inline-grid max-w-full overflow-x-clip px-[0.1em] text-start',
        className
      )}
      {...hoverHandlers}
    >
      <span className='sr-only'>{spoken}</span>
      {phrases.map((phrase, position) => (
        <span
          key={position}
          ref={(element) => {
            faces.current[position] = element;
          }}
          aria-hidden='true'
          data-current={position === shown}
          style={{ transformOrigin: AXIS }}
          className='col-start-1 row-start-1 data-[current=false]:pointer-events-none data-[current=false]:opacity-0 data-[current=false]:select-none'
        >
          {phrase}
        </span>
      ))}
    </span>
  );
}

const PHRASES = [
  'Plan the week together',
  'Ship before Friday',
  'Review on Monday',
];

const DIRECTIONS: Segment<SwapDirection>[] = [
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
];

/** About three turns each way, so both directions are seen before the demonstration goes round again. */
const UP_SHOWN_MS = 10000;

const DOWN_SHOWN_MS = 10000;

export default function TextEffect05() {
  const [direction, setDirection] = useState<SwapDirection>('up');
  const { isHovered, hoverHandlers } = useHover();
  const steps: AutoplayStep[] = [
    { after: UP_SHOWN_MS, run: () => setDirection('down') },
    { after: DOWN_SHOWN_MS, run: () => setDirection('up') },
  ];
  const { ref } = useAutoplay(steps, {
    loopAfter: 0,
    onReset: () => setDirection('up'),
    isEnabled: !isHovered,
  });

  return (
    <div
      ref={ref}
      className='@container flex w-full max-w-[34rem] flex-col gap-5'
      {...hoverHandlers}
    >
      <p className='text-2xl leading-tight font-semibold text-balance @md:text-3xl'>
        <PerspectiveSwap phrases={PHRASES} direction={direction} />
      </p>
      <Segments
        value={direction}
        segments={DIRECTIONS}
        onValueChange={setDirection}
        label='Turn direction'
        className='self-start'
      />
    </div>
  );
}
