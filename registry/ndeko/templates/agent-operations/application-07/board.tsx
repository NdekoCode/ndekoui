'use client';

import { LayoutGroup, motion, type Transition } from 'motion/react';
import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  elapsedOf,
  formatDuration,
  type PlanStep,
  type RunSnapshot,
} from '@/registry/ndeko/lib/agent-run';
import { springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';

import { AgentTile } from './agent-parts';
import {
  agentOf,
  boardOf,
  placementOf,
  type BoardTask,
  type LaneId,
} from './model';
import { Panel } from './panel';

type Lane = {
  id: LaneId;
  label: string;
  emptyLine: string;
};

const LANES: Lane[] = [
  { id: 'queued', label: 'Queued', emptyLine: 'Nothing waits' },
  { id: 'running', label: 'Running', emptyLine: 'Nothing runs' },
  { id: 'needs', label: 'Needs you', emptyLine: 'Nothing needs you' },
  { id: 'done', label: 'Done', emptyLine: 'Nothing is done yet' },
];

function dimOf(isDimmed: boolean) {
  if (isDimmed) {
    return 'opacity-40';
  }
  return undefined;
}

function stepOf(run: RunSnapshot, task: BoardTask): PlanStep | undefined {
  return run.plan.find((step) => step.id === task.id);
}

function TaskClock({
  step,
  lane,
}: {
  step: PlanStep | undefined;
  lane: LaneId;
}) {
  if (!step) {
    return null;
  }
  if (lane === 'running') {
    return (
      <LiveDuration
        item={step}
        isRunning
        className='text-muted-foreground text-xs'
      />
    );
  }
  if (lane === 'done') {
    const elapsed = elapsedOf(step, step.endedAt ?? 0);
    return (
      <span className='text-muted-foreground text-xs tabular-nums'>
        {formatDuration(elapsed)}
      </span>
    );
  }
  return null;
}

type TaskCardProps = {
  run: RunSnapshot;
  task: BoardTask;
  placement: string;
  travel: Transition;
  isDimmed: boolean;
  onReview: () => void;
};

function TaskCard({
  run,
  task,
  placement,
  travel,
  isDimmed,
  onReview,
}: TaskCardProps) {
  const owner = agentOf(run, task.ownerId);
  const step = stepOf(run, task);
  const isSkipped = task.status === 'skipped';

  return (
    <motion.li
      layout='position'
      layoutId={task.id}
      layoutDependency={placement}
      transition={{ layout: travel }}
    >
      <div
        className={cn(
          'bg-card hairline-ring ring-border dark:bg-foreground/[0.06] flex flex-col gap-2 rounded-lg p-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-opacity duration-200',
          dimOf(isDimmed)
        )}
      >
        <p
          className={cn(
            'text-[13px] leading-snug font-medium',
            isSkipped && 'text-muted-foreground line-through'
          )}
        >
          {task.title}
        </p>
        <div className='flex items-center gap-2 text-xs'>
          {owner && <AgentTile agent={owner} size='sm' />}
          <span className='text-muted-foreground min-w-0 flex-1 truncate'>
            {owner?.name}
          </span>
          <TaskClock step={step} lane={task.lane} />
          {isSkipped && <Badge variant='secondary'>Skipped</Badge>}
        </div>
        {task.lane === 'needs' && (
          <div className='flex items-center gap-2'>
            <Badge variant='warning'>Waiting on you</Badge>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={onReview}
              className='ms-auto'
            >
              Review
            </Button>
          </div>
        )}
      </div>
    </motion.li>
  );
}

type BoardProps = {
  run: RunSnapshot;
  focusAgentId: string | null;
  onReview: () => void;
  className?: string;
};

export function Board({ run, focusAgentId, onReview, className }: BoardProps) {
  const groupId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const travel = springOf(shouldReduceMotion);
  const tasks = boardOf(run);
  const placement = placementOf(tasks);
  const hasFocus = focusAgentId !== null;
  const isEmpty = tasks.length === 0;

  return (
    <Panel panel='board' title='Board' className={cn('@container', className)}>
      {isEmpty && (
        <p className='text-muted-foreground py-6 text-center text-xs'>
          The plan shows here as soon as the coordinator has made it.
        </p>
      )}
      {!isEmpty && (
        <LayoutGroup id={groupId}>
          <div className='grid grid-cols-1 gap-2 @lg:grid-cols-2 @3xl:grid-cols-4'>
            {LANES.map((lane) => {
              const inLane = tasks.filter((task) => task.lane === lane.id);
              const isLaneEmpty = inLane.length === 0;
              return (
                <section
                  key={lane.id}
                  className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex min-w-0 flex-col gap-1.5 rounded-lg p-1.5'
                >
                  <h3 className='text-muted-foreground flex h-6 items-center gap-1.5 px-1.5 text-xs font-medium'>
                    {lane.label}
                    <LayoutGroup inherit={false}>
                      <MotionNumber value={inLane.length} />
                    </LayoutGroup>
                  </h3>
                  <ul className='flex flex-col gap-1.5'>
                    {inLane.map((task) => (
                      <TaskCard
                        key={task.id}
                        run={run}
                        task={task}
                        placement={placement}
                        travel={travel}
                        isDimmed={hasFocus && focusAgentId !== task.ownerId}
                        onReview={onReview}
                      />
                    ))}
                  </ul>
                  {isLaneEmpty && (
                    <p className='text-muted-foreground px-1.5 pb-1 text-xs'>
                      {lane.emptyLine}
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        </LayoutGroup>
      )}
    </Panel>
  );
}
