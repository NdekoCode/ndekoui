'use client';

import { MotionNumber } from '@/components/core/motion-number';
import {
  HourglassIcon,
  LoaderIcon,
  MinusIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';

import { PLAN_STEPS, TILES } from './data';
import type { PlanStatus } from './session';
import { Tile } from './tile';

const STATUS_WORD: Record<PlanStatus, string> = {
  upcoming: 'Upcoming',
  running: 'Running',
  waiting: 'Waiting for you',
  done: 'Done',
  skipped: 'Skipped',
};

function StepGlyph({ status }: { status: PlanStatus }) {
  if (status === 'done') {
    return <DrawnCheck tone='success' entrance='draw' />;
  }
  if (status === 'running') {
    return <LoaderIcon className='text-muted-foreground size-4 animate-spin' />;
  }
  if (status === 'waiting') {
    return <HourglassIcon className='text-warning-foreground size-4' />;
  }
  if (status === 'skipped') {
    return <MinusIcon className='text-muted-foreground size-4' />;
  }
  return (
    <span className='hairline-ring ring-foreground/25 size-3.5 rounded-full' />
  );
}

function liftedOf(status: PlanStatus) {
  const isActive = status === 'running' || status === 'waiting';
  if (isActive) {
    return 'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-foreground/[0.06]';
  }
  return undefined;
}

function mutedOf(status: PlanStatus) {
  const isQuiet = status === 'upcoming' || status === 'skipped';
  if (isQuiet) {
    return 'text-muted-foreground';
  }
  return undefined;
}

type PlanTileProps = {
  steps: PlanStatus[];
  doneCount: number;
};

export function PlanTile({ steps, doneCount }: PlanTileProps) {
  return (
    <Tile copy={TILES.plan}>
      <div className='flex flex-col gap-2'>
        <p className='text-muted-foreground flex items-baseline gap-1 px-2 text-xs tabular-nums'>
          <MotionNumber value={doneCount} />
          <span>of {PLAN_STEPS.length} done</span>
        </p>
        <ol aria-label='Plan' className='flex flex-col gap-0.5'>
          {PLAN_STEPS.map((title, index) => {
            const status = steps[index];

            return (
              <li
                key={title}
                className={cn(
                  'flex h-8 items-center gap-2.5 rounded-lg px-2 text-[13px] transition-[background-color,box-shadow] duration-200',
                  liftedOf(status)
                )}
              >
                <span className='flex size-[18px] shrink-0 items-center justify-center'>
                  <Swap swapKey={status}>
                    <StepGlyph status={status} />
                  </Swap>
                </span>
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate transition-colors duration-200',
                    mutedOf(status)
                  )}
                >
                  <span className='sr-only'>{STATUS_WORD[status]}: </span>
                  {title}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </Tile>
  );
}
