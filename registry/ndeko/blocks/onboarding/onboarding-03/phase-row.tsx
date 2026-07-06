'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import type { Phase, PhaseId } from './data';
import { DrawnCheck } from './drawn-check';

export type PhaseStatus = 'done' | 'current' | 'upcoming';

const NUMBER =
  'inline-flex size-[18px] items-center justify-center rounded-full text-[11px] leading-none font-medium tabular-nums';

const STATUS_WORD: Record<PhaseStatus, string> = {
  done: 'Done',
  current: 'Current step',
  upcoming: 'Upcoming',
};

/** A summary that arrives after the first move fades in. Nothing fades when the page loads. */
function arrivalOf(hasMoved: boolean) {
  if (hasMoved) {
    return 'transition-opacity duration-300 starting:opacity-0';
  }
  return undefined;
}

type MarkerProps = {
  status: PhaseStatus;
  number: number;
};

/** The number turns into a check that draws itself when its step is done. A step done when the page loads shows its check at once. */
function Marker({ status, number }: MarkerProps) {
  return (
    <Swap swapKey={status} className='size-[18px] shrink-0 justify-center'>
      {status === 'done' && <DrawnCheck />}
      {status === 'current' && (
        <span className={cn(NUMBER, 'bg-primary text-primary-foreground')}>
          {number}
        </span>
      )}
      {status === 'upcoming' && (
        <span
          className={cn(NUMBER, 'bg-foreground/[0.06] text-muted-foreground')}
        >
          {number}
        </span>
      )}
    </Swap>
  );
}

export type PhaseRowProps = {
  phase: Phase;
  number: number;
  status: PhaseStatus;
  /** The mark beside the step. The last step stays open on its result and shows its check once its run is over. */
  marker: PhaseStatus;
  /** What a step that is done left behind, said in one line. */
  summary: string;
  /** What the step asks for, while it is the current one. */
  body: React.ReactNode;
  /** True once the session moved between steps at least once. */
  hasMoved: boolean;
  onEdit: (phase: PhaseId) => void;
};

/**
 * One step of the setup. Done, it folds into a single line that says what it left behind, with the
 * way back to it; current, it opens under its heading; upcoming, it waits in the faint ink.
 */
export function PhaseRow({
  phase,
  number,
  status,
  marker,
  summary,
  body,
  hasMoved,
  onEdit,
}: PhaseRowProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = rowPresenceOf(shouldReduceMotion);
  const isDone = status === 'done';
  const isCurrent = status === 'current';
  const isUpcoming = status === 'upcoming';

  return (
    <li className='flex flex-col'>
      <div className='flex min-h-10 items-center gap-3'>
        <Marker status={marker} number={number} />
        {isDone && (
          <p
            className={cn(
              'flex min-w-0 flex-1 items-baseline gap-2',
              arrivalOf(hasMoved)
            )}
          >
            <span className='text-muted-foreground shrink-0 text-xs'>
              <span className='sr-only'>{STATUS_WORD.done}: </span>
              {phase.label}
            </span>
            <span className='min-w-0 truncate text-[13px]'>{summary}</span>
          </p>
        )}
        {isCurrent && (
          <h2
            data-phase-heading
            tabIndex={-1}
            className='focus-visible:ring-ring/25 min-w-0 flex-1 rounded-sm text-sm font-medium text-balance outline-none focus-visible:ring-[3px]'
          >
            <span className='sr-only'>{STATUS_WORD.current}: </span>
            {phase.title}
          </h2>
        )}
        {isUpcoming && (
          <p className='text-muted-foreground min-w-0 flex-1 truncate text-[13px]'>
            <span className='sr-only'>{STATUS_WORD.upcoming}: </span>
            {phase.title}
          </p>
        )}
        {isDone && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            aria-label={`Edit ${phase.label}`}
            onClick={() => onEdit(phase.id)}
            className='text-muted-foreground -me-1.5 shrink-0'
          >
            Edit
          </Button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {isCurrent && (
          <motion.div
            key='body'
            className='-mx-1 overflow-hidden px-1'
            {...presence}
          >
            <div className='flex flex-col gap-4 pt-0.5 pb-4 @md:ps-[1.875rem]'>
              <p className='text-muted-foreground text-xs leading-5 text-pretty'>
                {phase.lead}
              </p>
              {body}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
