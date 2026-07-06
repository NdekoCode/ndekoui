'use client';

import { motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { formatDuration } from '@/registry/ndeko/lib/agent-run';
import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleXIcon,
  HandIcon,
  LoaderCircleIcon,
} from '@/registry/ndeko/lib/icons';
import { EASE_IN_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import type { StepRun, StepStatus } from './run';

const STATUS_WORD: Record<StepStatus, string> = {
  running: 'running',
  retrying: 'trying again',
  failed: 'failed',
  waiting: 'waiting for you',
  done: 'done',
  denied: 'denied by you',
  skipped: 'skipped',
};

const ONE_TURN = { rotate: 360 };

const TURN_TIMING = { duration: 0.8, ease: EASE_IN_OUT_STRONG };

/** The mark turns once when a step starts, then holds still: nothing keeps spinning while a step only waits to end. */
function TurningMark() {
  const shouldReduceMotion = usePrefersReducedMotion();

  if (shouldReduceMotion) {
    return <LoaderCircleIcon className='text-primary-ink size-4' />;
  }
  return (
    <motion.span
      initial={{ rotate: 0 }}
      animate={ONE_TURN}
      transition={TURN_TIMING}
      className='inline-flex'
    >
      <LoaderCircleIcon className='text-primary-ink size-4' />
    </motion.span>
  );
}

function StatusGlyph({ status }: { status: StepStatus }) {
  const isAtWork = status === 'running' || status === 'retrying';
  if (isAtWork) {
    return <TurningMark />;
  }
  if (status === 'failed') {
    return <CircleXIcon className='text-destructive-ink size-4' />;
  }
  if (status === 'waiting') {
    return <HandIcon className='text-warning-foreground size-4' />;
  }
  if (status === 'done') {
    return <CircleCheckIcon className='text-success-foreground size-4' />;
  }
  if (status === 'denied') {
    return <CircleXIcon className='text-muted-foreground size-4' />;
  }
  return <CircleDashedIcon className='text-muted-foreground size-4' />;
}

/** A step that is done shows how long it took, one that was left out says so. */
function captionOf(stepRun: StepRun) {
  if (stepRun.status === 'skipped') {
    return 'Skipped';
  }
  const hasDuration = stepRun.status === 'done' && stepRun.ms > 0;
  if (hasDuration) {
    return formatDuration(stepRun.ms);
  }
  return null;
}

type StateMarkProps = {
  stepRun: StepRun | undefined;
};

/** Drawn for the eye only: the button of the step says the same state in words. */
export function StateMark({ stepRun }: StateMarkProps) {
  if (!stepRun) {
    return null;
  }
  const caption = captionOf(stepRun);

  return (
    <span aria-hidden='true' className='flex shrink-0 items-center gap-1'>
      {caption && (
        <span className='text-muted-foreground text-[11px] leading-4 tabular-nums'>
          {caption}
        </span>
      )}
      <Swap swapKey={stepRun.status} className='size-4'>
        <StatusGlyph status={stepRun.status} />
      </Swap>
    </span>
  );
}

function timedWordOf(word: string, ms: number) {
  if (ms <= 0) {
    return word;
  }
  const duration = formatDuration(ms);
  return `${word} in ${duration}`;
}

export function stateWordsOf(stepRun: StepRun | undefined) {
  if (!stepRun) {
    return 'not run yet';
  }
  const word = STATUS_WORD[stepRun.status];
  if (stepRun.status === 'failed') {
    const reason = stepRun.note ?? 'no answer';
    return `${word}: ${reason}`;
  }
  if (stepRun.status !== 'done') {
    return word;
  }
  const timed = timedWordOf(word, stepRun.ms);
  if (stepRun.note) {
    return `${timed}. ${stepRun.note}`;
  }
  return timed;
}
