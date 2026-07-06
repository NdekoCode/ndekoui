'use client';

import { AnimatePresence, motion } from 'motion/react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  type PlanStep,
  type RunSnapshot,
  type RunStatus,
  seriesColorOf,
  type StepStatus,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { LoaderIcon } from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { CallStatusMark } from '@/registry/ndeko/ui/call-status';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { ClockGate, LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Wash } from '@/registry/ndeko/ui/wash';

import { AGENT, type Tool, type ToolId, TOOLS } from './data';
import { SESSION } from './run-script';

const AGENT_COLOR = seriesColorOf(1);

const STEP_WORD: Record<StepStatus, string> = {
  upcoming: 'Upcoming',
  running: 'Running',
  done: 'Done',
  failed: 'Failed',
  skipped: 'Skipped',
};

const RUN_WORD: Record<RunStatus, string> = {
  idle: 'Queued',
  running: 'Running',
  waiting: 'Waiting',
  done: 'Done',
  failed: 'Failed',
  cancelled: 'Stopped',
};

const DONE_MESSAGE =
  'Run finished: the release notes are drafted and a pull request is open.';

function isToolId(value: string): value is ToolId {
  return Object.hasOwn(TOOLS, value);
}

function toolOf(call: ToolCall): Tool | null {
  if (!isToolId(call.tool)) {
    return null;
  }
  return TOOLS[call.tool];
}

function resultOf(call: ToolCall) {
  if (typeof call.output === 'string') {
    return call.output;
  }
  return '';
}

function announcementOf(run: RunSnapshot) {
  if (run.status === 'done') {
    return DONE_MESSAGE;
  }
  return '';
}

function StepGlyph({ status }: { status: StepStatus }) {
  if (status === 'done') {
    return <DrawnCheck tone='success' entrance='draw' />;
  }
  if (status === 'running') {
    return <LoaderIcon className='text-muted-foreground size-4 animate-spin' />;
  }
  return (
    <span className='hairline-ring ring-foreground/25 size-3.5 rounded-full' />
  );
}

function PlanRow({ step }: { step: PlanStep }) {
  const isUpcoming = step.status === 'upcoming';

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
          isUpcoming && 'text-muted-foreground'
        )}
      >
        <span className='sr-only'>{STEP_WORD[step.status]}: </span>
        {step.title}
      </span>
    </li>
  );
}

/** What a call found unfolds under it once it is done; its time sits in a box of its own width. */
function CallRow({ call }: { call: ToolCall }) {
  const tool = toolOf(call);
  const isRunning = call.status === 'running';
  const isDone = call.status === 'done';
  const result = resultOf(call);

  return (
    <div className='flex items-start gap-2.5 pb-2'>
      {tool && <BrandTile brand={tool.brand} size='lg' title={tool.name} />}
      <div className='flex min-w-0 flex-1 flex-col'>
        <p className='py-1 text-[13px] leading-5 text-pretty'>{call.label}</p>
        <Fold open={isDone}>
          <p className='text-muted-foreground text-xs text-pretty'>{result}</p>
        </Fold>
      </div>
      <span className='flex h-7 shrink-0 items-center gap-2'>
        <LiveDuration
          item={call}
          isRunning={isRunning}
          className='text-muted-foreground w-11 text-end text-xs'
        />
        <CallStatusMark status={call.status} />
      </span>
    </div>
  );
}

/**
 * A small run of the agent, playing beside the hero: the plan ticks while two tools are called
 * and their results unfold, under the ink of a run in progress. Clicking in it lets the run end;
 * Replay starts it again.
 */
export function LiveRun() {
  const {
    ref,
    isInView,
    isAutoplaying,
    state: run,
    isFinished,
    restart,
  } = useSession(SESSION);
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = rowPresenceOf(shouldReduceMotion);
  const isRunning = run.status === 'running';
  const runWord = RUN_WORD[run.status];
  const canReplay = isFinished && !isAutoplaying;
  const announcement = announcementOf(run);
  const message = spokenUnless(isAutoplaying, announcement);

  useKeptHeight(ref);

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex min-h-[21rem] w-full flex-col rounded-2xl p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      >
        <div
          role='group'
          aria-label={`Run of ${AGENT.name}: ${run.title}`}
          className='bg-foreground/[0.03] relative isolate flex flex-1 flex-col gap-3 rounded-[calc(var(--radius-2xl)-0.375rem)] p-4'
        >
          <Wash color='var(--info)' isShown={isRunning} />
          <div className='flex items-center gap-2.5'>
            <MeshTile seed={AGENT.name} color={AGENT_COLOR} size='lg' />
            <div className='flex min-w-0 flex-1 flex-col'>
              <p className='truncate text-[13px] font-medium'>{AGENT.name}</p>
              <p className='text-muted-foreground truncate text-xs'>
                {run.title}
              </p>
            </div>
            <div className='flex shrink-0 flex-col items-end text-xs'>
              <Swap swapKey={runWord} className='font-medium'>
                {runWord}
              </Swap>
              <LiveDuration
                item={run}
                isRunning={isRunning}
                className='text-muted-foreground w-12 text-end'
              />
            </div>
          </div>
          <ol aria-label='Plan' className='flex flex-col'>
            {run.plan.map((step) => (
              <PlanRow key={step.id} step={step} />
            ))}
          </ol>
          <ul aria-label='Tool calls' className='flex flex-col'>
            <AnimatePresence initial={false}>
              {run.calls.map((call) => (
                <motion.li
                  key={call.id}
                  {...presence}
                  className='overflow-hidden'
                >
                  <CallRow call={call} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
        <div className='flex min-h-9 items-center justify-between gap-2 ps-2.5 pe-1'>
          <span className='text-muted-foreground text-xs'>
            Illustrative run
          </span>
          <ReplayButton isShown={canReplay} onReplay={restart} />
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
