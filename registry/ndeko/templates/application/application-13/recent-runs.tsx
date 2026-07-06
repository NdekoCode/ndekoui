'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { useNow } from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  elapsedOf,
  formatCost,
  formatDuration,
} from '@/registry/ndeko/lib/agent-run';
import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { LetterTile } from '@/registry/ndeko/ui/letter-tile';

import { AGENTS, type RunStatus } from './data';
import type { Decision, Run } from './session';

const STATUS_WORD: Record<RunStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  waiting: 'Waiting on you',
  done: 'Done',
  failed: 'Failed',
};

const STATUS_WORDS = Object.values(STATUS_WORD);

const DOT_TONE: Record<RunStatus, string> = {
  queued: 'bg-muted-foreground/45',
  running: 'bg-info',
  waiting: 'bg-warning',
  done: 'bg-success',
  failed: 'bg-destructive',
};

const WORD_TONE: Record<RunStatus, string> = {
  queued: 'text-muted-foreground',
  running: 'text-foreground',
  waiting: 'text-warning-foreground',
  done: 'text-muted-foreground',
  failed: 'text-destructive-ink',
};

/** Only a run that is really running breathes. */
function pulseOf(status: RunStatus) {
  if (status === 'running') {
    return 'animate-pulse';
  }
  return undefined;
}

const SECOND_MS = 1000;

/** A run on the start screen has been going for minutes: its clock ticks once a second, and only this text re-renders. */
function RunningClock({ run }: { run: Run }) {
  const now = useNow(SECOND_MS, true);
  const elapsed = elapsedOf(run, now);

  return <span className='w-14 tabular-nums'>{formatDuration(elapsed)}</span>;
}

function RunClock({ run }: { run: Run }) {
  if (run.status === 'queued') {
    return null;
  }
  if (run.status === 'running') {
    return <RunningClock run={run} />;
  }
  const end = run.endedAt ?? run.startedAt;
  const elapsed = elapsedOf(run, end);
  return <span className='tabular-nums'>{formatDuration(elapsed)}</span>;
}

/** A run that waits shows its request and its two answers. Any other run shows the trace it kept, if it has one. */
function traceOf(run: Run) {
  if (run.status === 'waiting') {
    return undefined;
  }
  return run.note;
}

type RunRowProps = {
  run: Run;
  isAllowPressed: boolean;
  onDecide: (id: string, decision: Decision) => void;
};

function RunRow({ run, isAllowPressed, onDecide }: RunRowProps) {
  const agent = AGENTS[run.agentId];
  const isWaiting = run.status === 'waiting';
  const hasCost = run.costUsd > 0;
  const trace = traceOf(run);

  function allow() {
    onDecide(run.id, 'approved');
  }

  function deny() {
    onDecide(run.id, 'denied');
  }

  return (
    <div
      data-run={run.id}
      tabIndex={-1}
      className='flex items-start gap-3 px-3 py-2.5 outline-none'
    >
      <LetterTile initial={agent.initial} series={agent.series} size='lg' />
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <p className='flex items-baseline gap-3'>
          <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
            {run.title}
          </span>
          {hasCost && (
            <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
              {formatCost(run.costUsd)}
            </span>
          )}
        </p>
        <p className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs'>
          <span>{agent.name}</span>
          <span
            className={cn(
              'flex items-center gap-1.5 transition-colors duration-200',
              WORD_TONE[run.status]
            )}
          >
            <span
              aria-hidden='true'
              className={cn(
                'size-1.5 shrink-0 rounded-full transition-colors duration-200',
                DOT_TONE[run.status],
                pulseOf(run.status)
              )}
            />
            <WordRoll text={STATUS_WORD[run.status]} labels={STATUS_WORDS} />
          </span>
          <RunClock run={run} />
        </p>
        {isWaiting && (
          <div className='flex flex-wrap items-center gap-2 pt-1.5'>
            <span className='text-foreground/85 min-w-0 flex-1 text-xs'>
              {run.request}
            </span>
            <Button
              type='button'
              size='sm'
              aria-label={`Allow: ${run.request}`}
              onClick={allow}
              className={pressedSolidOf(isAllowPressed)}
            >
              Allow
            </Button>
            <Button
              type='button'
              size='sm'
              variant='outline'
              aria-label={`Deny: ${run.request}`}
              onClick={deny}
            >
              Deny
            </Button>
          </div>
        )}
        {trace && (
          <p
            key={trace}
            className='text-muted-foreground text-xs transition-opacity duration-300 starting:opacity-0'
          >
            {trace}
          </p>
        )}
      </div>
    </div>
  );
}

type RecentRunsProps = {
  runs: Run[];
  pressed: string | null;
  onDecide: (id: string, decision: Decision) => void;
};

/** A new run arrives at the top with its height and the oldest one leaves, so the list keeps its length. */
export function RecentRuns({ runs, pressed, onDecide }: RecentRunsProps) {
  const titleId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);

  return (
    <section aria-labelledby={titleId} className='flex flex-col gap-2'>
      <div className='flex items-center gap-2 px-1'>
        <h2 id={titleId} className='text-[13px] font-medium'>
          Recent runs
        </h2>
        <Badge variant='secondary'>Illustrative</Badge>
      </div>
      <ul
        data-solid
        className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      >
        <AnimatePresence initial={false}>
          {runs.map((run) => (
            <motion.li
              key={run.id}
              className='overflow-hidden'
              {...rowPresence}
            >
              <RunRow
                run={run}
                isAllowPressed={pressed === 'allow'}
                onDecide={onDecide}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
