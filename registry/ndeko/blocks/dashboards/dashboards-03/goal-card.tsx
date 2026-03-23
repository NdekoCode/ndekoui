'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  useReducedMotion,
} from 'motion/react';

import { cn } from '@/registry/ndeko/lib/utils';

import type { Sprint } from './data';
import {
  formatShare,
  percentAmountOf,
  type Goal,
  type GoalTone,
} from './figures';
import { SlidingFigure } from './sliding-figure';

const MOVE_TRANSITION: Transition = {
  duration: 0.3,
  ease: [0.77, 0, 0.175, 1],
};

const MARKER_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const MARKER_OUT: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };

const INSTANT: Transition = { duration: 0 };

const VERDICT_TONE: Record<GoalTone, string> = {
  good: 'text-success-foreground',
  behind: 'text-warning-foreground',
  neutral: 'text-foreground',
};

function moveTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return MOVE_TRANSITION;
}

function taskWordOf(count: number) {
  if (count === 1) {
    return 'task';
  }
  return 'tasks';
}

function percentTextOf(share: number) {
  const percent = share * 100;
  return `${percent}%`;
}

type GoalMeterProps = {
  goal: Goal;
  transition: Transition;
};

/** Done against planned, with a marker where the team should be by today. Both slide into place. */
function GoalMeter({ goal, transition }: GoalMeterProps) {
  const hiddenShare = 1 - goal.share;
  const hiddenText = percentTextOf(hiddenShare);
  const fillOffset = `-${hiddenText}`;
  const taskWord = taskWordOf(goal.planned);
  const valueText = `${goal.done} of ${goal.planned} ${taskWord} done`;
  const hasMarker = goal.expectedShare !== null;
  const markerShare = goal.expectedShare ?? 0;
  const markerOffset = percentTextOf(markerShare);

  return (
    <div
      role='progressbar'
      aria-label='Sprint progress'
      aria-valuemin={0}
      aria-valuemax={goal.planned}
      aria-valuenow={goal.done}
      aria-valuetext={valueText}
      className='bg-foreground/[0.08] relative h-2 rounded-full'
    >
      <span className='absolute inset-0 overflow-hidden rounded-full'>
        <motion.span
          initial={false}
          animate={{ x: fillOffset }}
          transition={transition}
          className='bg-primary absolute inset-0 rounded-full'
        />
      </span>
      <AnimatePresence initial={false}>
        {hasMarker && (
          <motion.span
            key='marker'
            aria-hidden='true'
            initial={{ opacity: 0, x: markerOffset }}
            animate={{
              opacity: 1,
              x: markerOffset,
              transition: { opacity: MARKER_IN, x: transition },
            }}
            exit={{ opacity: 0, transition: MARKER_OUT }}
            className='pointer-events-none absolute -inset-y-1 left-0 w-full'
          >
            <span className='bg-foreground ring-card absolute inset-y-0 left-0 w-0.5 -translate-x-1/2 rounded-full ring-2' />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

type GoalCardProps = {
  sprint: Sprint;
  goal: Goal;
};

export function GoalCard({ sprint, goal }: GoalCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const transition = moveTransitionOf(shouldReduceMotion);
  const shareAmount = percentAmountOf(goal.share);
  const shareText = formatShare(goal.share);
  const doneText = String(goal.done);
  const plannedText = String(goal.planned);
  const hasMarker = goal.expectedShare !== null;
  const taskWord = taskWordOf(goal.planned);

  return (
    <section
      aria-label={`Sprint ${sprint.number} goal`}
      className='surface-brand flex flex-col gap-4 rounded-xl p-5'
    >
      <div className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1'>
        <p className='text-muted-foreground text-xs font-medium'>
          {`Sprint ${sprint.number} goal`}
        </p>
        <span className='text-muted-foreground text-xs'>
          Illustrative figures
        </span>
      </div>
      <p className='text-base font-semibold text-balance'>{sprint.goal}</p>
      <div className='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1'>
        <p className='flex items-baseline gap-1.5'>
          <SlidingFigure
            amount={goal.done}
            text={doneText}
            className='text-2xl font-semibold'
          />
          <span className='text-muted-foreground text-[13px]'>of</span>
          <SlidingFigure
            amount={goal.planned}
            text={plannedText}
            className='text-[13px] font-medium'
          />
          <span className='text-muted-foreground text-[13px]'>
            {`${taskWord} done`}
          </span>
        </p>
        <SlidingFigure
          amount={shareAmount}
          text={shareText}
          className='text-lg font-semibold'
        />
      </div>
      <GoalMeter goal={goal} transition={transition} />
      <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs'>
        <span className={cn('font-medium', VERDICT_TONE[goal.tone])}>
          {goal.verdict}
        </span>
        <span className='text-muted-foreground flex items-center gap-1.5'>
          {hasMarker && (
            <span
              aria-hidden='true'
              className='bg-foreground inline-block h-2.5 w-0.5 rounded-full'
            />
          )}
          {goal.timeLine}
        </span>
      </div>
    </section>
  );
}
