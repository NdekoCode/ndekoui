'use client';

import { useEffect, useRef, useState } from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { cn } from '@/registry/ndeko/lib/utils';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { useHover } from './_parts/use-hover';
import { usePlayWhileSeen } from './_parts/use-play-while-seen';

const DEFAULT_STEP_MS = 90;

const DEFAULT_PAUSE_MS = 1400;

const ROLL_MS = 520;

const ROLL_EASING = 'cubic-bezier(0.65, 0, 0.35, 1)';

/** The axis sits half a line behind the letter, so the face that rolls away and the one below it that rolls up are two sides of one cube. */
const AXIS = '50% 50% -0.5lh';

const PERSPECTIVE = '16em';

const SPACE = ' ';

const BOTTOM_FACE: React.CSSProperties = {
  transform: 'rotateX(-90deg)',
  transformOrigin: '50% 0%',
};

function periodOf(letterCount: number, stepMs: number, pauseMs: number) {
  const waveMs = Math.max(0, letterCount - 1) * stepMs;
  return waveMs + ROLL_MS + pauseMs;
}

/**
 * A letter rests, then rolls a quarter turn that ends on a face identical to the one it started
 * on. The next round starts there, so no round has a seam, whatever the speed.
 */
function rollKeyframesOf(period: number): Keyframe[] {
  const restShare = 1 - ROLL_MS / period;
  return [
    { offset: 0, transform: 'rotateX(0deg)' },
    { offset: restShare, transform: 'rotateX(0deg)', easing: ROLL_EASING },
    { offset: 1, transform: 'rotateX(90deg)' },
  ];
}

function cubesIn(root: HTMLElement) {
  const cubes = root.querySelectorAll<HTMLElement>('[data-cube]');
  return Array.from(cubes);
}

type CubeProps = {
  letter: string;
  position: number;
};

function Cube({ letter, position }: CubeProps) {
  if (letter === SPACE) {
    return <span className='inline-block'>{letter}</span>;
  }
  return (
    <span
      data-cube=''
      data-position={position}
      style={{ transformOrigin: AXIS }}
      className='relative inline-block transform-3d'
    >
      <span className='block backface-hidden'>{letter}</span>
      <span
        aria-hidden='true'
        style={BOTTOM_FACE}
        className='absolute inset-x-0 top-full block select-none backface-hidden'
      >
        {letter}
      </span>
    </span>
  );
}

export type RollingLettersProps = {
  text: string;
  /** The gap between one letter starting to roll and the next, in milliseconds, at normal speed. */
  stepMs?: number;
  /** How long the letters rest between two waves, in milliseconds, at normal speed. */
  pauseMs?: number;
  /** How fast the wave runs, as a multiple of normal speed. A change of speed never makes a letter jump. */
  speed?: number;
  className?: string;
};

/**
 * Letters that roll forward like small cubes, one after another, in a wave that runs through the
 * word and starts again with no seam. Each letter is two faces of one cube; the text stays in the
 * page for screen readers. The wave plays only while the word is on screen and the tab is shown,
 * and under reduced motion the word rests still.
 */
export function RollingLetters({
  text,
  stepMs = DEFAULT_STEP_MS,
  pauseMs = DEFAULT_PAUSE_MS,
  speed = 1,
  className,
}: RollingLettersProps) {
  const { ref, isPlaying } = usePlayWhileSeen<HTMLSpanElement>();
  const rolls = useRef<Animation[]>([]);
  const latestSpeed = useRef(speed);
  const letters = Array.from(text);

  useEffect(() => {
    latestSpeed.current = speed;
  });

  useEffect(() => {
    const root = ref.current;
    if (!root || !isPlaying) {
      return;
    }
    const letterCount = Array.from(text).length;
    const period = periodOf(letterCount, stepMs, pauseMs);
    const keyframes = rollKeyframesOf(period);
    const started = cubesIn(root).map((cube) => {
      const position = Number(cube.dataset.position);
      const roll = cube.animate(keyframes, {
        duration: period,
        delay: position * stepMs,
        iterations: Number.POSITIVE_INFINITY,
      });
      roll.playbackRate = latestSpeed.current;
      return roll;
    });
    rolls.current = started;
    return () => {
      for (const roll of started) {
        roll.cancel();
      }
      rolls.current = [];
    };
  }, [ref, isPlaying, text, stepMs, pauseMs]);

  useEffect(() => {
    for (const roll of rolls.current) {
      roll.updatePlaybackRate(speed);
    }
  }, [speed]);

  return (
    <span
      ref={ref}
      className={cn(
        'relative -mx-[0.12em] inline-block overflow-x-clip px-[0.12em]',
        className
      )}
    >
      <span className='sr-only'>{text}</span>
      <span
        aria-hidden='true'
        style={{ perspective: PERSPECTIVE }}
        className='inline-flex whitespace-pre'
      >
        {letters.map((letter, position) => (
          <Cube key={position} letter={letter} position={position} />
        ))}
      </span>
    </span>
  );
}

type Pace = 'calm' | 'quick';

const SPEEDS: Record<Pace, number> = {
  calm: 1,
  quick: 2.4,
};

const PACES: Segment<Pace>[] = [
  { value: 'calm', label: 'Calm' },
  { value: 'quick', label: 'Quick' },
];

/** Enough rounds at each pace for the difference to be seen before the demonstration goes round again. */
const CALM_SHOWN_MS = 9000;

const QUICK_SHOWN_MS = 6000;

export default function TextEffect06() {
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

  return (
    <div
      ref={ref}
      className='@container flex w-full max-w-[34rem] flex-col items-center gap-5'
      {...hoverHandlers}
    >
      <p className='text-[length:clamp(2.25rem,14cqw,4rem)] leading-[1.1] font-semibold'>
        <RollingLetters text='Launch day' speed={SPEEDS[pace]} />
      </p>
      <Segments
        value={pace}
        segments={PACES}
        onValueChange={setPace}
        label='Wave pace'
      />
    </div>
  );
}
