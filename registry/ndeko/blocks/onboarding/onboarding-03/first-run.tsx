'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  seriesColorOf,
  type PlanStep,
  type StepStatus,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import {
  CircleCheckIcon,
  LoaderIcon,
  RotateCcwIcon,
} from '@/registry/ndeko/lib/icons';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { CallStatusMark } from '@/registry/ndeko/ui/call-status';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { Wash } from '@/registry/ndeko/ui/wash';

import { AGENT_SEED, AGENT_SERIES, modelOf, type ModelId } from './data';
import {
  callsOf,
  isRunDone,
  planOf,
  resultOf,
  runTimesOf,
  tasksOf,
  type Run,
  type RunTask,
} from './run';

const STEP_WORD: Record<StepStatus, string> = {
  upcoming: 'Upcoming',
  running: 'Running',
  done: 'Done',
  failed: 'Failed',
  skipped: 'Skipped',
};

const DURATION = 'text-muted-foreground w-12 shrink-0 text-end text-xs';

const LAND = { duration: 0.3, ease: EASE_OUT_STRONG };

const LEAVE = { opacity: 0, transition: { duration: 0.12 } };

const LANDING = { opacity: 0, scale: 1.04 };

const LANDED = { opacity: 1, scale: 1 };

const FADING_IN = { opacity: 0 };

const FADED_IN = { opacity: 1 };

/** The result settles from a slightly larger size. Reduced motion keeps the fade. */
function landingOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return FADING_IN;
  }
  return LANDING;
}

function landedOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return FADED_IN;
  }
  return LANDED;
}

function runWordOf(isDone: boolean) {
  if (isDone) {
    return 'Done';
  }
  return 'Running';
}

function stepInkOf(status: StepStatus) {
  if (status === 'upcoming') {
    return 'text-muted-foreground';
  }
  return 'text-foreground';
}

function StepGlyph({ status }: { status: StepStatus }) {
  if (status === 'done') {
    return <DrawnCheck tone='success' entrance='draw' pace='calm' />;
  }
  if (status === 'running') {
    return <LoaderIcon className='text-primary-ink size-4 animate-spin' />;
  }
  return (
    <span className='hairline-ring ring-foreground/25 size-3.5 rounded-full' />
  );
}

function PlanRow({ step }: { step: PlanStep }) {
  return (
    <li className='flex h-7 items-center gap-2.5 text-[13px]'>
      <span className='flex size-[18px] shrink-0 items-center justify-center'>
        <Swap swapKey={step.status}>
          <StepGlyph status={step.status} />
        </Swap>
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate transition-colors duration-200',
          stepInkOf(step.status)
        )}
      >
        <span className='sr-only'>{STEP_WORD[step.status]}: </span>
        {step.title}
      </span>
    </li>
  );
}

type CallRowProps = {
  call: ToolCall;
  task: RunTask;
};

/** What the call found unfolds under it once it is done. The time sits in a box of its own width. */
function CallRow({ call, task }: CallRowProps) {
  const isRunning = call.status === 'running';
  const isDone = call.status === 'done';
  const hasStarted = call.startedAt !== undefined;

  return (
    <li className='flex items-start gap-2.5'>
      <BrandTile brand={task.tool.brand} size='lg' />
      <div className='flex min-w-0 flex-1 flex-col'>
        <p className='py-1 text-[13px] leading-5 text-pretty'>{call.label}</p>
        <Fold open={isDone}>
          <p className='text-muted-foreground pb-0.5 text-xs text-pretty'>
            {task.task.finding}
          </p>
        </Fold>
      </div>
      <span className='flex h-7 shrink-0 items-center gap-2'>
        <span className={DURATION}>
          {hasStarted && <LiveDuration item={call} isRunning={isRunning} />}
        </span>
        <CallStatusMark status={call.status} />
      </span>
    </li>
  );
}

type ResultCardProps = {
  run: Run;
  onRunAgain: () => void;
};

function ResultCard({ run, onRunAgain }: ResultCardProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.section
      aria-label='Result of the first run'
      initial={landingOf(shouldReduceMotion)}
      animate={landedOf(shouldReduceMotion)}
      exit={LEAVE}
      transition={LAND}
      className='bg-success/10 flex flex-col gap-2 rounded-lg p-3.5'
    >
      <div className='flex items-center gap-2'>
        <CircleCheckIcon className='text-success-foreground size-4 shrink-0' />
        <h3 className='min-w-0 flex-1 truncate text-[13px] font-medium'>
          First job done
        </h3>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          data-run-again
          onClick={onRunAgain}
          className='-my-1 -me-1.5'
        >
          <RotateCcwIcon />
          Run again
        </Button>
      </div>
      <p className='text-[13px] leading-relaxed text-pretty'>{resultOf(run)}</p>
    </motion.section>
  );
}

export type FirstRunProps = {
  run: Run;
  agentName: string;
  model: ModelId;
  onRunAgain: () => void;
};

/**
 * The first job of the agent as it happens: the plan ticks, two tools are called and the result
 * lands under them. The tray wears the ink of a run in progress while it lasts.
 */
export function FirstRun({ run, agentName, model, onRunAgain }: FirstRunProps) {
  const isDone = isRunDone(run);
  const isRunning = !isDone;
  const plan = planOf(run);
  const calls = callsOf(run);
  const tasks = tasksOf(run.tools);
  const picked = modelOf(model);
  const runWord = runWordOf(isDone);

  return (
    <div className='flex flex-col gap-3'>
      <div className='bg-foreground/[0.04] relative isolate flex flex-col gap-3 rounded-lg p-3'>
        <Wash color='var(--info)' isShown={isRunning} />
        <div className='flex items-center gap-2.5'>
          <MeshTile
            seed={AGENT_SEED}
            color={seriesColorOf(AGENT_SERIES)}
            size='lg'
          />
          <div className='flex min-w-0 flex-1 flex-col'>
            <p className='truncate text-[13px] font-medium'>
              {agentName.trim()}
            </p>
            <p className='text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs'>
              <BrandTile brand={picked.brand} size='sm' />
              <span className='truncate'>{picked.name}</span>
            </p>
          </div>
          <div className='flex shrink-0 flex-col items-end text-xs'>
            <Swap swapKey={runWord} className='font-medium'>
              {runWord}
            </Swap>
            <LiveDuration
              item={runTimesOf(run)}
              isRunning={isRunning}
              className='text-muted-foreground w-12 text-end'
            />
          </div>
        </div>
        <ol aria-label='Plan' className='flex flex-col'>
          {plan.map((step) => (
            <PlanRow key={step.id} step={step} />
          ))}
        </ol>
        <ul aria-label='Tool calls' className='flex flex-col gap-2'>
          {calls.map((call, index) => (
            <CallRow key={call.id} call={call} task={tasks[index]} />
          ))}
        </ul>
      </div>
      <AnimatePresence initial={false}>
        {isDone && (
          <ResultCard key={run.startedAt} run={run} onRunAgain={onRunAgain} />
        )}
      </AnimatePresence>
    </div>
  );
}
