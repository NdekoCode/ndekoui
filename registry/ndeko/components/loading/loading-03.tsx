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

/** The diamond: four points meeting at the centre, their tips 7 units out. */
const DIAMOND = 'M12 5 19 12 12 19 5 12Z';

/** One point of the diamond, pointing up from the centre; it lengthens by stretching along its axis. */
const POINT = 'M12 12 8.5 8.5 12 5 15.5 8.5Z';

const TURN_CYCLE_MS = 1500;

/** Where in the cycle the quarter turn has come to rest. */
const TURNED_AT = 0.42;

const GLINT_PEAK = 1.62;

const ECHO_PEAK = 1.22;

const RISE_EASING = 'cubic-bezier(0.23, 1, 0.32, 1)';

const FALL_EASING = 'cubic-bezier(0.45, 0, 0.55, 1)';

/** Used where the browser cannot ease along a sampled curve. */
const FALLBACK_TURN_EASING = 'cubic-bezier(0.23, 1, 0.32, 1)';

/** A light spring: about 3% past the quarter turn, then still. */
const SPRING_DAMPING = 0.75;

/** The spring's swing has fallen to a five-hundredth of its size by the end of the turn. */
const SPRING_DECAY = Math.log(500);

const SPRING_SAMPLES = 40;

/** The point that comes up to the top as the diamond turns, and the one that comes down opposite it. */
const GLINT_ANGLE = 270;

const ECHO_ANGLE = 90;

function springAt(progress: number) {
  const undamped = Math.sqrt(1 - SPRING_DAMPING * SPRING_DAMPING);
  const frequency = (SPRING_DECAY / SPRING_DAMPING) * undamped;
  const ratio = SPRING_DAMPING / undamped;
  const angle = frequency * progress;
  const envelope = Math.exp(-SPRING_DECAY * progress);
  const swing = Math.cos(angle) + ratio * Math.sin(angle);
  return 1 - envelope * swing;
}

function sampledEasingOf(curve: (progress: number) => number) {
  const points = Array.from({ length: SPRING_SAMPLES + 1 }, (_, index) => {
    const progress = index / SPRING_SAMPLES;
    const value = curve(progress);
    return value.toFixed(4);
  });
  points[SPRING_SAMPLES] = '1';
  return `linear(${points.join(', ')})`;
}

const SPRING_EASING = sampledEasingOf(springAt);

function turnEasingOf() {
  const canSample = CSS.supports('transition-timing-function', SPRING_EASING);
  if (canSample) {
    return SPRING_EASING;
  }
  return FALLBACK_TURN_EASING;
}

function pointTransformOf(angle: number, length: number) {
  return `rotate(${angle}deg) scaleY(${length})`;
}

function turnKeyframesOf(): Keyframe[] {
  return [
    { transform: 'rotate(0deg)', offset: 0, easing: turnEasingOf() },
    { transform: 'rotate(90deg)', offset: TURNED_AT },
    { transform: 'rotate(90deg)', offset: 1 },
  ];
}

type Glint = {
  angle: number;
  /** How long the point grows, as a share of its resting length. */
  peak: number;
  /** When it starts to grow, is longest and is back, as shares of the cycle. */
  risesAt: number;
  peaksAt: number;
  restsAt: number;
};

const TOP_GLINT: Glint = {
  angle: GLINT_ANGLE,
  peak: GLINT_PEAK,
  risesAt: 0.2,
  peaksAt: 0.44,
  restsAt: 0.8,
};

const BOTTOM_GLINT: Glint = {
  angle: ECHO_ANGLE,
  peak: ECHO_PEAK,
  risesAt: 0.24,
  peaksAt: 0.46,
  restsAt: 0.76,
};

function glintKeyframesOf(glint: Glint): Keyframe[] {
  const rest = pointTransformOf(glint.angle, 1);
  const longest = pointTransformOf(glint.angle, glint.peak);
  return [
    { transform: rest, offset: 0 },
    { transform: rest, offset: glint.risesAt, easing: RISE_EASING },
    { transform: longest, offset: glint.peaksAt, easing: FALL_EASING },
    { transform: rest, offset: glint.restsAt },
    { transform: rest, offset: 1 },
  ];
}

function loopOf(
  root: HTMLElement,
  selector: string,
  keyframes: Keyframe[]
): Loop[] {
  const element = root.querySelector(selector);
  if (!element) {
    return [];
  }
  const timing = { duration: TURN_CYCLE_MS, iterations: Infinity };
  return [{ element, keyframes, timing }];
}

/**
 * The diamond snaps a quarter turn on a light spring; the point that comes up to the top lengthens
 * and draws back, and the one opposite it answers. Its four points look alike, so each turn starts
 * where the last one ended and every point takes its turn at the top.
 */
function sparkLoopsOf(root: HTMLElement): Loop[] {
  return [
    ...loopOf(root, '[data-turn]', turnKeyframesOf()),
    ...loopOf(root, '[data-glint]', glintKeyframesOf(TOP_GLINT)),
    ...loopOf(root, '[data-echo]', glintKeyframesOf(BOTTOM_GLINT)),
  ];
}

type SparkPose = {
  turn: string;
  glint: string;
  echo: string;
};

const REST_POSE: SparkPose = {
  turn: 'rotate(0deg)',
  glint: pointTransformOf(GLINT_ANGLE, 1),
  echo: pointTransformOf(ECHO_ANGLE, 1),
};

/** Under reduced motion the spark rests a quarter turn on, its top point lit. */
const STILL_POSE: SparkPose = {
  turn: 'rotate(90deg)',
  glint: pointTransformOf(GLINT_ANGLE, 1.5),
  echo: pointTransformOf(ECHO_ANGLE, 1.16),
};

function sparkPoseOf(showsStill: boolean) {
  if (showsStill) {
    return STILL_POSE;
  }
  return REST_POSE;
}

function sparkLayerOf(isDone: boolean) {
  if (isDone) {
    return 'opacity-0 duration-150';
  }
  return 'opacity-100 duration-200';
}

const POINT_SHAPE = (
  <svg
    viewBox='0 0 24 24'
    fill='currentColor'
    className='absolute inset-0 size-full'
  >
    <path d={POINT} />
  </svg>
);

type SparkMarkProps = {
  size: ThinkingSize;
  isDone: boolean;
  canLoop: boolean;
  isPlaying: boolean;
  isStill: boolean;
};

function SparkMark({
  size,
  isDone,
  canLoop,
  isPlaying,
  isStill,
}: SparkMarkProps) {
  const sparkRef = useRef<HTMLSpanElement>(null);
  const showsStill = isStill && !isDone;
  const pose = sparkPoseOf(showsStill);

  useLoops(sparkRef, { canLoop, isPlaying, create: sparkLoopsOf });

  return (
    <span
      aria-hidden='true'
      className={cn(
        'relative grid shrink-0 place-items-center',
        MARK_BOX[size]
      )}
    >
      <span
        ref={sparkRef}
        className={cn(
          'text-foreground absolute inset-0 transition-opacity ease-(--ease-out-strong)',
          sparkLayerOf(isDone)
        )}
      >
        <span
          data-turn=''
          style={{ transform: pose.turn }}
          className='absolute inset-0'
        >
          <svg
            viewBox='0 0 24 24'
            fill='currentColor'
            className='absolute inset-0 size-full'
          >
            <path d={DIAMOND} />
          </svg>
          <span
            data-glint=''
            style={{ transform: pose.glint }}
            className='absolute inset-0'
          >
            {POINT_SHAPE}
          </span>
          <span
            data-echo=''
            style={{ transform: pose.echo }}
            className='absolute inset-0'
          >
            {POINT_SHAPE}
          </span>
        </span>
      </span>
      <AnimatePresence initial={false}>
        {isDone && (
          <DrawnCheck key='done' tone='success' className='size-full' />
        )}
      </AnimatePresence>
    </span>
  );
}

/**
 * A thinking status: a small diamond in the text colour turns by quarter turns on a light spring,
 * and the point that comes up to the top glints by lengthening, beside a label a soft light passes
 * over. When the work is done the diamond settles and a check draws itself in its place.
 */
export function ThinkingSpark({
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
      <SparkMark
        size={size}
        isDone={isDone}
        canLoop={canLoop}
        isPlaying={isPlaying}
        isStill={isStill}
      />
    </ThinkingStatus>
  );
}

const AGENT: ThinkingDemoAgent = { name: 'Researcher', series: 3 };

const STEPS = ['Thinking', 'Searching the sources', 'Comparing the findings'];

function renderSpark({ label, isDone }: IndicatorState) {
  return <ThinkingSpark label={label} isDone={isDone} size='lg' />;
}

export default function Loading03() {
  return (
    <ThinkingDemo
      agent={AGENT}
      steps={STEPS}
      doneLabel='Findings ready'
      renderIndicator={renderSpark}
    />
  );
}
