'use client';

import { useEffect, useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { ArrowRightIcon, BellIcon } from '@/registry/ndeko/lib/icons';

import type { Pose } from './use-pose';

export type LivingIconName = 'arrow' | 'download' | 'bin' | 'bell';

export type GlyphProps = {
  pose: Pose;
};

type Act = {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
};

type Acts = {
  hover: Act;
  press: Act;
};

const OUT_STRONG = 'cubic-bezier(0.23, 1, 0.32, 1)';

const IN_OUT_STRONG = 'cubic-bezier(0.77, 0, 0.175, 1)';

const SWING_OFFSETS = [0, 0.16, 0.42, 0.64, 0.82, 1];

const SWING_REACH = [0, 1, -0.75, 0.45, -0.2, 0];

/** The bell hangs from its top, a little below the top of its box. */
const BELL_HINGE = '50% 8%';

/** The lid turns about its left end, which is where the bin's hinge would be. */
const LID_HINGE = '4px 7.5px';

const POSE_MOTION =
  'transition-transform duration-200 ease-(--ease-out-strong)';

/** The arrow leaves through the right edge of its slot and comes back from the left edge, with a short beat of an empty slot between. */
const ARROW_ROLL: Keyframe[] = [
  {
    offset: 0,
    transform: 'translateX(0%)',
    opacity: 1,
    easing: IN_OUT_STRONG,
  },
  { offset: 0.4, transform: 'translateX(130%)', opacity: 0 },
  {
    offset: 0.46,
    transform: 'translateX(-130%)',
    opacity: 0,
    easing: OUT_STRONG,
  },
  { offset: 1, transform: 'translateX(0%)', opacity: 1 },
];

const ARROW_POKE: Keyframe[] = [
  { offset: 0, transform: 'translateX(0px)' },
  { offset: 0.4, transform: 'translateX(2.5px)' },
  { offset: 1, transform: 'translateX(0px)' },
];

function swingKeyframesOf(amplitude: number): Keyframe[] {
  return SWING_OFFSETS.map((offset, step) => {
    const angle = amplitude * SWING_REACH[step];
    return { offset, transform: `rotate(${angle}deg)`, easing: 'ease-in-out' };
  });
}

const ARROW_ACTS: Acts = {
  hover: { keyframes: ARROW_ROLL, options: { duration: 560 } },
  press: {
    keyframes: ARROW_POKE,
    options: { duration: 280, easing: OUT_STRONG },
  },
};

const BELL_ACTS: Acts = {
  hover: { keyframes: swingKeyframesOf(14), options: { duration: 800 } },
  press: { keyframes: swingKeyframesOf(20), options: { duration: 520 } },
};

const ARROW_DROP: Record<Pose, string> = {
  rest: 'translateY(0px)',
  hover: 'translateY(2.4px)',
  press: 'translateY(3.6px)',
};

const LID_TURN: Record<Pose, string> = {
  rest: 'translateY(0px) rotate(0deg)',
  hover: 'translateY(-1.5px) rotate(-12deg)',
  press: 'translateY(0.9px) rotate(0deg)',
};

/**
 * Plays an act on the element it returns when the pose changes: the hover act when a control is
 * reached from rest, the press act whenever it is pressed. Nothing plays under reduced motion.
 */
function useActs<Element extends HTMLElement>(pose: Pose, acts: Acts) {
  const ref = useRef<Element>(null);
  const before = useRef<Pose>('rest');
  const isStill = usePrefersReducedMotion();

  useEffect(() => {
    const previous = before.current;
    before.current = pose;
    const element = ref.current;
    const hasChanged = previous !== pose;
    if (!element) {
      return;
    }
    if (!hasChanged || isStill) {
      return;
    }
    if (pose === 'press') {
      element.animate(acts.press.keyframes, acts.press.options);
      return;
    }
    const startsHover = pose === 'hover' && previous === 'rest';
    if (startsHover) {
      element.animate(acts.hover.keyframes, acts.hover.options);
    }
  }, [pose, acts, isStill]);

  return ref;
}

function ArrowGlyph({ pose }: GlyphProps) {
  const ref = useActs<HTMLSpanElement>(pose, ARROW_ACTS);

  return (
    <span
      aria-hidden='true'
      className='flex size-4 shrink-0 items-center justify-center overflow-hidden'
    >
      <span ref={ref} className='flex'>
        <ArrowRightIcon />
      </span>
    </span>
  );
}

function BellGlyph({ pose }: GlyphProps) {
  const ref = useActs<HTMLSpanElement>(pose, BELL_ACTS);

  return (
    <span
      ref={ref}
      aria-hidden='true'
      style={{ transformOrigin: BELL_HINGE }}
      className='flex shrink-0'
    >
      <BellIcon />
    </span>
  );
}

/** The module's tray and arrow cannot move apart, so this one draws them as two parts on the same grid and stroke. */
function DownloadGlyph({ pose }: GlyphProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.75}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      className='size-4'
    >
      <g style={{ transform: ARROW_DROP[pose] }} className={POSE_MOTION}>
        <path d='M12 3.5v11' />
        <path d='m7.5 10 4.5 4.5 4.5-4.5' />
      </g>
      <path d='M4.5 15.5v2.2a2.3 2.3 0 0 0 2.3 2.3h10.4a2.3 2.3 0 0 0 2.3-2.3v-2.2' />
    </svg>
  );
}

/** The module's bin draws its lid and its body as one shape, so the lid cannot lift; this one draws them apart. */
function BinGlyph({ pose }: GlyphProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.75}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      className='size-4'
    >
      <g
        style={{ transform: LID_TURN[pose], transformOrigin: LID_HINGE }}
        className={POSE_MOTION}
      >
        <path d='M4 7.5h16' />
        <path d='M9.5 7.5V6.1A1.1 1.1 0 0 1 10.6 5h2.8a1.1 1.1 0 0 1 1.1 1.1v1.4' />
      </g>
      <path d='M6 7.5l.85 11.1a2 2 0 0 0 2 1.9h6.3a2 2 0 0 0 2-1.9L18 7.5' />
      <path d='M10.2 11.5v5M13.8 11.5v5' />
    </svg>
  );
}

export const GLYPHS: Record<LivingIconName, React.ComponentType<GlyphProps>> = {
  arrow: ArrowGlyph,
  download: DownloadGlyph,
  bin: BinGlyph,
  bell: BellGlyph,
};
