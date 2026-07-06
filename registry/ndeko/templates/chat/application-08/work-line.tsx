'use client';

import { WordRoll } from '@/components/core/word-roll';
import {
  elapsedOf,
  formatDuration,
  type CallStatus,
} from '@/registry/ndeko/lib/agent-run';
import { CircleXIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { CallStatusMark } from '@/registry/ndeko/ui/call-status';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';

import { PLAN, planSeedOf } from './data';
import type { PlanRun, Stage, StepStatus } from './session';

const TITLES = PLAN.map((seed) => seed.title);

const SEGMENT_TONE: Record<StepStatus, string> = {
  upcoming: 'bg-foreground/10',
  running: 'bg-primary/45 animate-pulse',
  waiting: 'bg-warning',
  done: 'bg-primary',
  skipped: 'bg-foreground/10',
};

const STEP_WORD: Record<StepStatus, string> = {
  upcoming: 'to do',
  running: 'running',
  waiting: 'waiting on you',
  done: 'done',
  skipped: 'skipped',
};

function currentRunOf(plan: PlanRun[]) {
  const live = plan.find((run) => run.status === 'running');
  if (live) {
    return live;
  }
  return plan.find((run) => run.status === 'waiting');
}

function titleOf(plan: PlanRun[], stage: Stage, duration: string) {
  if (stage === 'done') {
    return `Worked for ${duration}`;
  }
  if (stage === 'declined') {
    return 'Run stopped at the request';
  }
  if (stage === 'stopped') {
    return 'Stopped by you';
  }
  const current = currentRunOf(plan);
  if (!current) {
    return 'Working';
  }
  return planSeedOf(current.id).title;
}

function isClockRunning(stage: Stage) {
  return stage === 'working' || stage === 'answering';
}

function markOf(stage: Stage): CallStatus {
  if (stage === 'asking') {
    return 'waiting';
  }
  if (stage === 'done') {
    return 'done';
  }
  return 'running';
}

type WorkLineProps = {
  plan: PlanRun[];
  stage: Stage;
  startedAt?: number;
  endedAt?: number;
  /** False while the details are already on screen. */
  canShowDetails: boolean;
  onShowDetails: () => void;
};

export function WorkLine({
  plan,
  stage,
  startedAt,
  endedAt,
  canShowDetails,
  onShowDetails,
}: WorkLineProps) {
  const span = { startedAt, endedAt };
  const elapsed = elapsedOf(span, endedAt ?? 0);
  const duration = formatDuration(elapsed);
  const title = titleOf(plan, stage, duration);
  const isHalted = stage === 'declined' || stage === 'stopped';
  const isWaiting = stage === 'asking';

  return (
    <div className='flex flex-col gap-2 px-1'>
      <div className='flex h-7 items-center gap-2 text-[13px]'>
        {!isHalted && <CallStatusMark status={markOf(stage)} />}
        {isHalted && (
          <CircleXIcon className='text-muted-foreground size-4 shrink-0' />
        )}
        <span className='min-w-0 truncate font-medium'>
          <WordRoll text={title} labels={TITLES} />
        </span>
        {isClockRunning(stage) && (
          <LiveDuration
            item={span}
            isRunning
            className='text-muted-foreground w-10 shrink-0 text-xs'
          />
        )}
        {isWaiting && (
          <span className='text-warning-foreground shrink-0 text-xs'>
            Waiting on you
          </span>
        )}
        {canShowDetails && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={onShowDetails}
            className='text-muted-foreground ms-auto h-6 shrink-0 px-2'
          >
            Run details
          </Button>
        )}
      </div>
      <ol aria-label='Steps of the run' className='flex gap-1'>
        {plan.map((run) => {
          const seed = planSeedOf(run.id);
          return (
            <li
              key={run.id}
              className={cn(
                'h-1 min-w-0 flex-1 rounded-full transition-colors duration-300',
                SEGMENT_TONE[run.status]
              )}
            >
              <span className='sr-only'>
                {seed.title}, {STEP_WORD[run.status]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
