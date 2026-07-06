'use client';

import { AnimatePresence } from 'motion/react';
import { useRef } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';

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

/** How tall each bar grows at the top of its swell, from its resting pill: the middle one most. */
const PEAKS = [2.3, 2.9, 3.1, 2.8, 2.2];

/** Under reduced motion the wave rests on one moment of its swell. */
const STILL_SCALES = [1.5, 2.6, 3.1, 2.1, 1.3];

const SWELL_MS = 1150;

const BAR_STEP_MS = 120;

const RISE_EASING = 'cubic-bezier(0.33, 0, 0.2, 1)';

const FALL_EASING = 'cubic-bezier(0.45, 0, 0.55, 1)';

const BARS = PEAKS.map((_, index) => index);

const REST = 'scaleY(1)';

function swellKeyframesOf(peak: number): Keyframe[] {
  return [
    { transform: REST, offset: 0, easing: RISE_EASING },
    { transform: `scaleY(${peak})`, offset: 0.3, easing: FALL_EASING },
    { transform: REST, offset: 0.68 },
    { transform: REST, offset: 1 },
  ];
}

/** The bars rise and fall one after the other, from the first to the last, then breathe out together. */
function swellLoopsOf(root: HTMLElement): Loop[] {
  const bars = Array.from(root.querySelectorAll('[data-bar]'));
  return bars.map((element, index) => ({
    element,
    keyframes: swellKeyframesOf(PEAKS[index] ?? 1),
    timing: {
      duration: SWELL_MS,
      delay: index * BAR_STEP_MS,
      iterations: Infinity,
    },
  }));
}

function barStyleOf(index: number, showsStill: boolean) {
  if (!showsStill) {
    return { transform: REST };
  }
  const scale = STILL_SCALES[index] ?? 1;
  return { transform: `scaleY(${scale})` };
}

function barsLayerOf(isDone: boolean) {
  if (isDone) {
    return 'opacity-0 duration-150';
  }
  return 'opacity-100 duration-200';
}

type WaveMarkProps = {
  size: ThinkingSize;
  isDone: boolean;
  canLoop: boolean;
  isPlaying: boolean;
  isStill: boolean;
};

function WaveMark({
  size,
  isDone,
  canLoop,
  isPlaying,
  isStill,
}: WaveMarkProps) {
  const barsRef = useRef<HTMLSpanElement>(null);
  const showsStill = isStill && !isDone;

  useLoops(barsRef, { canLoop, isPlaying, create: swellLoopsOf });

  return (
    <span
      aria-hidden='true'
      className={cn(
        'relative grid shrink-0 place-items-center',
        MARK_BOX[size]
      )}
    >
      <span
        ref={barsRef}
        className={cn(
          'absolute inset-0 flex items-center justify-between transition-opacity ease-(--ease-out-strong)',
          barsLayerOf(isDone)
        )}
      >
        {BARS.map((index) => (
          <span
            key={index}
            data-bar=''
            style={barStyleOf(index, showsStill)}
            className='bg-primary h-[32%] w-[13%] rounded-full'
          />
        ))}
      </span>
      <AnimatePresence initial={false}>
        {isDone && (
          <DrawnCheck key='done' tone='success' className='size-full' />
        )}
      </AnimatePresence>
    </span>
  );
}

type ThinkingWaveProps = ThinkingIndicatorProps & {
  /** Only the wave, for a header or a button; the label is still read by screen readers. */
  isCompact?: boolean;
};

/**
 * A thinking status: five rounded bars swell one after the other, a small wave that breathes,
 * beside a label a soft light passes over. When the work is done the bars settle and a check
 * draws itself in their place.
 */
export function ThinkingWave({
  label = DEFAULT_LABEL,
  size = 'md',
  isDone = false,
  isCompact = false,
  className,
}: ThinkingWaveProps) {
  const { ref, canLoop, isPlaying, isStill } = useLoopGate(!isDone);

  return (
    <ThinkingStatus
      ref={ref}
      label={label}
      size={size}
      isDone={isDone}
      canLoop={canLoop}
      isPlaying={isPlaying}
      showsLabel={!isCompact}
      className={className}
    >
      <WaveMark
        size={size}
        isDone={isDone}
        canLoop={canLoop}
        isPlaying={isPlaying}
        isStill={isStill}
      />
    </ThinkingStatus>
  );
}

const AGENT: ThinkingDemoAgent = { name: 'Writer', series: 2 };

const STEPS = ['Thinking', 'Reading the thread', 'Drafting a reply'];

function renderWave({ label, isDone }: IndicatorState) {
  return <ThinkingWave label={label} isDone={isDone} size='lg' />;
}

/** The compact wave after the agent's name, as a list of conversations would show it. */
function renderCompactWave({ label, isDone }: IndicatorState) {
  return (
    <span aria-hidden='true' className='flex'>
      <ThinkingWave label={label} isDone={isDone} size='sm' isCompact />
    </span>
  );
}

export default function Loading02() {
  return (
    <ThinkingDemo
      agent={AGENT}
      steps={STEPS}
      doneLabel='Reply ready'
      renderIndicator={renderWave}
      renderBesideName={renderCompactWave}
    />
  );
}
