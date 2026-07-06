'use client';

import { motion, type Transition } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';

const LEFT_PANEL = '24,34 88,22 88,126 24,138';
const MIDDLE_PANEL = '88,22 152,34 152,138 88,126';
const RIGHT_PANEL = '152,34 216,22 216,126 152,138';

const CONTOURS = [
  'M28 62C44 54 62 60 86 48',
  'M28 84C46 78 60 86 86 74',
  'M92 104C110 96 128 108 150 100',
  'M156 110C174 100 190 106 214 94',
  'M156 82C176 74 194 80 214 70',
];

const WALKED = 'M44 112C56 98 66 100 74 88S82 72 86 68';

const LOST = 'M86 68C100 60 112 76 126 70S146 52 160 56S186 66 194 50';

const BREAK_POINT = { x: 86, y: 68 };

const END_POINT = { x: 194, y: 50 };

const PIN = 'M0 0C-2-4-6-7-6-11A6 6 0 1 1 6-11C6-7 2-4 0 0Z';

const FOUND = { pathLength: 1, opacity: 1 };

const LOST_TRAIL = { pathLength: 0, opacity: 0 };

const DRAW: Transition = { duration: 0.7, ease: EASE_OUT_STRONG };

const LET_GO: Transition = {
  opacity: { duration: 0.15 },
  pathLength: { duration: 0, delay: 0.15 },
};

const FADE: Transition = { duration: 0.2 };

/** Under reduced motion the trail is whole at once and only fades in. */
const SHOW_STILL: Transition = {
  opacity: { duration: 0.2 },
  pathLength: { duration: 0 },
};

const PIN_SHOWN = { opacity: 1, scale: 1 };

const PIN_HIDDEN = { opacity: 0, scale: 0.8 };

const PIN_FADED = { opacity: 0, scale: 1 };

const PIN_ARRIVE: Transition = {
  duration: 0.3,
  ease: EASE_OUT_STRONG,
  delay: 0.5,
};

const PIN_LEAVE: Transition = { duration: 0.12 };

/** The pin grows from its tip, where it touches the map. */
const PIN_ORIGIN = { originX: 0.5, originY: 1 };

function trailOf(isFound: boolean) {
  if (isFound) {
    return FOUND;
  }
  return LOST_TRAIL;
}

function trailMotionOf(isFound: boolean, shouldReduceMotion: boolean) {
  if (!isFound) {
    return LET_GO;
  }
  if (shouldReduceMotion) {
    return SHOW_STILL;
  }
  return DRAW;
}

function pinOf(isFound: boolean, shouldReduceMotion: boolean) {
  if (isFound) {
    return PIN_SHOWN;
  }
  if (shouldReduceMotion) {
    return PIN_FADED;
  }
  return PIN_HIDDEN;
}

function pinMotionOf(isFound: boolean, shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return FADE;
  }
  if (isFound) {
    return PIN_ARRIVE;
  }
  return PIN_LEAVE;
}

function breakOpacityOf(isFound: boolean) {
  if (isFound) {
    return 0;
  }
  return 1;
}

type TrailMapProps = {
  isFound: boolean;
};

export function TrailMap({ isFound }: TrailMapProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const endTransform = `translate(${END_POINT.x} ${END_POINT.y})`;

  return (
    <svg
      viewBox='0 0 240 152'
      aria-hidden='true'
      className='w-full max-w-[17rem] overflow-visible'
    >
      <ellipse
        cx='120'
        cy='144'
        rx='96'
        ry='5'
        className='fill-foreground/[0.05]'
      />
      <polygon
        points={LEFT_PANEL}
        strokeWidth='1'
        vectorEffect='non-scaling-stroke'
        className='fill-card stroke-border'
      />
      <polygon
        points={MIDDLE_PANEL}
        strokeWidth='1'
        vectorEffect='non-scaling-stroke'
        className='fill-card stroke-border'
      />
      <polygon points={MIDDLE_PANEL} className='fill-foreground/[0.045]' />
      <polygon
        points={RIGHT_PANEL}
        strokeWidth='1'
        vectorEffect='non-scaling-stroke'
        className='fill-card stroke-border'
      />
      {CONTOURS.map((contour) => (
        <path
          key={contour}
          d={contour}
          fill='none'
          strokeWidth='1'
          vectorEffect='non-scaling-stroke'
          className='stroke-foreground/10'
        />
      ))}
      <path
        d={LOST}
        fill='none'
        strokeWidth='1.5'
        strokeDasharray='2 5'
        strokeLinecap='round'
        className='stroke-foreground/20'
      />
      <path
        d={WALKED}
        fill='none'
        strokeWidth='2.5'
        strokeLinecap='round'
        className='stroke-primary'
      />
      <motion.path
        d={LOST}
        fill='none'
        strokeWidth='2.5'
        strokeLinecap='round'
        className='stroke-primary'
        initial={false}
        animate={trailOf(isFound)}
        transition={trailMotionOf(isFound, shouldReduceMotion)}
      />
      <motion.circle
        cx={BREAK_POINT.x}
        cy={BREAK_POINT.y}
        r='3.5'
        strokeWidth='1.5'
        className='fill-background stroke-foreground/40'
        initial={false}
        animate={{ opacity: breakOpacityOf(isFound) }}
        transition={FADE}
      />
      <circle cx='44' cy='112' r='5' className='fill-primary' />
      <circle cx='44' cy='112' r='2' className='fill-primary-foreground' />
      <g transform={endTransform}>
        <motion.g
          style={PIN_ORIGIN}
          initial={false}
          animate={pinOf(isFound, shouldReduceMotion)}
          transition={pinMotionOf(isFound, shouldReduceMotion)}
        >
          <path d={PIN} className='fill-primary' />
          <circle cx='0' cy='-11' r='2.2' className='fill-primary-foreground' />
        </motion.g>
      </g>
    </svg>
  );
}
