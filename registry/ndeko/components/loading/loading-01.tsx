'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useRef } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { DoneLayer, useDrawnStroke } from './_parts/done-mark';
import type { Loop } from './_parts/loops';
import {
  ThinkingDemo,
  type IndicatorState,
  type ThinkingDemoAgent,
} from './_parts/thinking-demo';
import {
  DEFAULT_LABEL,
  MARK_BOX,
  ThinkingStatus,
  type ThinkingIndicatorProps,
  type ThinkingSize,
} from './_parts/thinking-status';
import { useLoopGate, useLoops } from './_parts/use-loops';

const DOT_COUNT = 8;

const DOTS = Array.from({ length: DOT_COUNT }, (_, index) => index);

const TURN_DEG = 360 / DOT_COUNT;

const WOBBLE_LAP_MS = 1200;

const DOT_STEP_MS = WOBBLE_LAP_MS / DOT_COUNT;

/** Reaches are in dot sizes, so the same keyframes serve every size of the mark. */
const REST_REACH = -200;

const OUT_REACH = -258;

const IN_REACH = -186;

const REST_OPACITY = 0.35;

const RISE_EASING = 'cubic-bezier(0.23, 1, 0.32, 1)';

const SWAY_EASING = 'cubic-bezier(0.45, 0, 0.55, 1)';

type DotPose = {
  reach: number;
  scale: number;
  opacity: number;
};

const REST_POSE: DotPose = {
  reach: REST_REACH,
  scale: 1,
  opacity: REST_OPACITY,
};

/** Under reduced motion the ring rests on one moment of its wobble, the bulge near the top right. */
const STILL_POSES: DotPose[] = [
  { reach: -192, scale: 0.96, opacity: 0.6 },
  { reach: -250, scale: 1.1, opacity: 1 },
  { reach: -234, scale: 1.06, opacity: 0.8 },
  { reach: -210, scale: 1.02, opacity: 0.5 },
  REST_POSE,
  REST_POSE,
  REST_POSE,
  { reach: -196, scale: 0.98, opacity: 0.45 },
];

function transformOf(index: number, reach: number, scale: number) {
  const angle = index * TURN_DEG;
  return `rotate(${angle}deg) translateY(${reach}%) scale(${scale})`;
}

function wobbleKeyframesOf(index: number): Keyframe[] {
  const rest = transformOf(index, REST_REACH, 1);
  return [
    {
      transform: rest,
      opacity: REST_OPACITY,
      offset: 0,
      easing: RISE_EASING,
    },
    {
      transform: transformOf(index, OUT_REACH, 1.12),
      opacity: 1,
      offset: 0.2,
      easing: SWAY_EASING,
    },
    {
      transform: transformOf(index, IN_REACH, 0.94),
      opacity: 0.6,
      offset: 0.42,
      easing: SWAY_EASING,
    },
    { transform: rest, opacity: REST_OPACITY, offset: 0.62 },
    { transform: rest, opacity: REST_OPACITY, offset: 1 },
  ];
}

/** Each dot pushes out from the ring and sways back in turn, so a bulge travels round it. */
function wobbleLoopsOf(root: HTMLElement): Loop[] {
  const dots = Array.from(root.querySelectorAll('[data-dot]'));
  return dots.map((element, index) => ({
    element,
    keyframes: wobbleKeyframesOf(index),
    timing: {
      duration: WOBBLE_LAP_MS,
      delay: index * DOT_STEP_MS,
      iterations: Infinity,
    },
  }));
}

function poseOf(index: number, showsStill: boolean) {
  if (showsStill) {
    return STILL_POSES[index] ?? REST_POSE;
  }
  return REST_POSE;
}

function dotStyleOf(index: number, showsStill: boolean) {
  const pose = poseOf(index, showsStill);
  const transform = transformOf(index, pose.reach, pose.scale);
  return { transform, opacity: pose.opacity };
}

function dotsLayerOf(isDone: boolean) {
  if (isDone) {
    return 'opacity-0 duration-150';
  }
  return 'opacity-100 duration-200';
}

function ClosedRing() {
  const ring = useDrawnStroke(0.42);
  const check = useDrawnStroke(0.26, 0.24);
  return (
    <DoneLayer>
      <motion.circle
        cx={12}
        cy={12}
        r={7.7}
        strokeWidth={1.75}
        transform='rotate(-90 12 12)'
        {...ring}
      />
      <motion.path
        d='M8.9 12.3 11 14.4 15.1 10'
        strokeWidth={1.75}
        {...check}
      />
    </DoneLayer>
  );
}

type RingMarkProps = {
  size: ThinkingSize;
  isDone: boolean;
  canLoop: boolean;
  isPlaying: boolean;
  isStill: boolean;
};

function RingMark({
  size,
  isDone,
  canLoop,
  isPlaying,
  isStill,
}: RingMarkProps) {
  const dotsRef = useRef<HTMLSpanElement>(null);
  const showsStill = isStill && !isDone;

  useLoops(dotsRef, { canLoop, isPlaying, create: wobbleLoopsOf });

  return (
    <span
      aria-hidden='true'
      className={cn('relative shrink-0', MARK_BOX[size])}
    >
      <span
        ref={dotsRef}
        className={cn(
          'absolute inset-0 transition-opacity ease-(--ease-out-strong)',
          dotsLayerOf(isDone)
        )}
      >
        {DOTS.map((index) => (
          <span
            key={index}
            data-dot=''
            style={dotStyleOf(index, showsStill)}
            className='bg-primary absolute top-1/2 left-1/2 -mt-[8%] -ml-[8%] size-[16%] rounded-full'
          />
        ))}
      </span>
      <AnimatePresence initial={false}>
        {isDone && <ClosedRing key='done' />}
      </AnimatePresence>
    </span>
  );
}

/**
 * A thinking status: eight dots on a ring push out and sway back in turn, so a bulge travels round
 * it, beside a label a soft light passes over. When the work is done the dots fade as the ring
 * draws itself closed round a check.
 */
export function ThinkingRing({
  label = DEFAULT_LABEL,
  size = 'md',
  isDone = false,
  className,
}: ThinkingIndicatorProps) {
  const { ref, canLoop, isPlaying, isStill } = useLoopGate(!isDone);

  return (
    <ThinkingStatus
      ref={ref}
      label={label}
      size={size}
      isDone={isDone}
      canLoop={canLoop}
      isPlaying={isPlaying}
      className={className}
    >
      <RingMark
        size={size}
        isDone={isDone}
        canLoop={canLoop}
        isPlaying={isPlaying}
        isStill={isStill}
      />
    </ThinkingStatus>
  );
}

const AGENT: ThinkingDemoAgent = { name: 'Planner', series: 1 };

const STEPS = ['Thinking', 'Reading the brief', 'Weighing three options'];

function renderRing({ label, isDone }: IndicatorState) {
  return <ThinkingRing label={label} isDone={isDone} size='lg' />;
}

export default function Loading01() {
  return (
    <ThinkingDemo
      agent={AGENT}
      steps={STEPS}
      doneLabel='Plan ready'
      renderIndicator={renderRing}
    />
  );
}
