'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useRef } from 'react';

import { noiseAt } from '@/registry/ndeko/lib/speech-envelope';
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

/**
 * The visor holds five bars, each a dot at rest, placed in hundredths of the mark: the drawing is
 * 24 units wide, the bars 1.5 units, centred 2.4 units apart on the visor's middle line.
 */
const BAR_LEFTS = ['26.875%', '36.875%', '46.875%', '56.875%', '66.875%'];

const BAR_TOP = '47.917%';

const BAR_SIZE = '6.25%';

/** The tallest each bar kicks, from its resting dot: the visor narrows at its ends, so the end bars stay shorter. */
const BAR_REACH = [2.1, 2.7, 2.8, 2.6, 2.0];

/** Each bar keeps its own rhythm, so the meter never moves as one block. */
const BAR_CYCLES_MS = [880, 1060, 940, 1140, 1000];

const BAR_DELAYS_MS = [0, 140, 60, 200, 100];

/** Under reduced motion the visor rests on one reading of its meter. */
const STILL_SCALES = [1.5, 2.3, 1.8, 2.5, 1.3];

/** A meter kicks up fast and falls back slowly, three times a cycle; the numbers place them in the cycle. */
const BEATS = [
  { kick: 0.08, fall: 0.3 },
  { kick: 0.4, fall: 0.62 },
  { kick: 0.72, fall: 0.92 },
];

/** What is left of a kick once the bar has fallen back. */
const FALLEN_SHARE = 0.25;

const METER_SEED = 7;

const KICK_EASING = 'cubic-bezier(0.23, 1, 0.32, 1)';

const FALL_EASING = 'cubic-bezier(0.45, 0, 0.55, 1)';

const BARS = BAR_LEFTS.map((_, index) => index);

const REST = 'scaleY(1)';

function scaleOf(scale: number) {
  return `scaleY(${scale})`;
}

function meterKeyframesOf(index: number): Keyframe[] {
  const reach = BAR_REACH[index] ?? 2;
  const keyframes: Keyframe[] = [
    { transform: REST, offset: 0, easing: KICK_EASING },
  ];
  for (const [beatIndex, beat] of BEATS.entries()) {
    const noise = noiseAt(index * BEATS.length + beatIndex, METER_SEED);
    const strength = 0.45 + 0.55 * noise;
    const kicked = 1 + (reach - 1) * strength;
    const fallen = 1 + (kicked - 1) * FALLEN_SHARE;
    keyframes.push({
      transform: scaleOf(kicked),
      offset: beat.kick,
      easing: FALL_EASING,
    });
    keyframes.push({
      transform: scaleOf(fallen),
      offset: beat.fall,
      easing: KICK_EASING,
    });
  }
  keyframes.push({ transform: REST, offset: 1 });
  return keyframes;
}

/** The five bars of the visor bounce like a level meter, each on its own rhythm. */
function meterLoopsOf(root: HTMLElement): Loop[] {
  const bars = Array.from(root.querySelectorAll('[data-bar]'));
  return bars.map((element, index) => ({
    element,
    keyframes: meterKeyframesOf(index),
    timing: {
      duration: BAR_CYCLES_MS[index] ?? 1000,
      delay: BAR_DELAYS_MS[index] ?? 0,
      iterations: Infinity,
    },
  }));
}

function barTransformOf(index: number, showsStill: boolean) {
  if (!showsStill) {
    return REST;
  }
  const scale = STILL_SCALES[index] ?? 1;
  return scaleOf(scale);
}

function barStyleOf(index: number, showsStill: boolean) {
  return {
    left: BAR_LEFTS[index],
    top: BAR_TOP,
    width: BAR_SIZE,
    height: BAR_SIZE,
    transform: barTransformOf(index, showsStill),
  };
}

function barsLayerOf(isDone: boolean) {
  if (isDone) {
    return 'opacity-0 duration-150';
  }
  return 'opacity-100 duration-200';
}

const HELMET = (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    className='text-foreground absolute inset-0 size-full'
  >
    <path d='M3.5 19.5V12a8.5 8.5 0 0 1 17 0v7.5' strokeWidth={1.75} />
    <path d='M2.75 19.5h18.5' strokeWidth={1.75} />
    <rect
      x={5.5}
      y={8.75}
      width={13}
      height={7}
      rx={3.5}
      strokeWidth={1.5}
      className='fill-foreground/[0.06]'
    />
  </svg>
);

function VisorCheck() {
  const check = useDrawnStroke(0.28, 0.12);
  return (
    <DoneLayer>
      <motion.path
        d='M9.6 12.5 11.3 14.2 14.6 10.6'
        strokeWidth={1.5}
        {...check}
      />
    </DoneLayer>
  );
}

type VisorMarkProps = {
  size: ThinkingSize;
  isDone: boolean;
  canLoop: boolean;
  isPlaying: boolean;
  isStill: boolean;
};

function VisorMark({
  size,
  isDone,
  canLoop,
  isPlaying,
  isStill,
}: VisorMarkProps) {
  const barsRef = useRef<HTMLSpanElement>(null);
  const showsStill = isStill && !isDone;

  useLoops(barsRef, { canLoop, isPlaying, create: meterLoopsOf });

  return (
    <span
      aria-hidden='true'
      className={cn('relative shrink-0', MARK_BOX[size])}
    >
      {HELMET}
      <span
        ref={barsRef}
        className={cn(
          'absolute inset-0 transition-opacity ease-(--ease-out-strong)',
          barsLayerOf(isDone)
        )}
      >
        {BARS.map((index) => (
          <span
            key={index}
            data-bar=''
            style={barStyleOf(index, showsStill)}
            className='bg-primary absolute rounded-full'
          />
        ))}
      </span>
      <AnimatePresence initial={false}>
        {isDone && <VisorCheck key='done' />}
      </AnimatePresence>
    </span>
  );
}

/**
 * A thinking status: a small helmet drawn in the text colour whose visor shows a voice meter, five
 * bars that bounce each on its own rhythm, beside a label a soft light passes over. When the work
 * is done the meter settles and the visor holds a check.
 */
export function ThinkingVisor({
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
      <VisorMark
        size={size}
        isDone={isDone}
        canLoop={canLoop}
        isPlaying={isPlaying}
        isStill={isStill}
      />
    </ThinkingStatus>
  );
}

const AGENT: ThinkingDemoAgent = { name: 'Reviewer', series: 4 };

const STEPS = [
  'Thinking',
  'Listening to the Goma call',
  'Noting the action items',
];

function renderVisor({ label, isDone }: IndicatorState) {
  return <ThinkingVisor label={label} isDone={isDone} size='lg' />;
}

export default function Loading04() {
  return (
    <ThinkingDemo
      agent={AGENT}
      steps={STEPS}
      doneLabel='Notes ready'
      renderIndicator={renderVisor}
    />
  );
}
