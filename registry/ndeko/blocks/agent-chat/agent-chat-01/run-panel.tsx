'use client';

import { AnimatePresence, motion } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import type {
  PlanStep,
  RunSnapshot,
  RunStatus,
  StepStatus,
  ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';
import { BlocksIcon, LoaderIcon, MinusIcon } from '@/registry/ndeko/lib/icons';
import {
  EASE_OUT_STRONG,
  rowPresenceOf,
} from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { CallStatusMark } from '@/registry/ndeko/ui/call-status';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';

const RUN_WORD: Record<RunStatus, string> = {
  idle: 'Not started',
  running: 'Running',
  waiting: 'Waiting on you',
  done: 'Done',
  failed: 'Failed',
  cancelled: 'Stopped',
};

const COST_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
};

const CHECK_PATH = 'M2.6 6.4 4.9 8.7 9.5 3.6';

const DRAW = { duration: 0.28, ease: EASE_OUT_STRONG, delay: 0.08 };

function isLive(status: RunStatus) {
  return status === 'running' || status === 'waiting';
}

function strokeStartOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { pathLength: 1 };
  }
  return { pathLength: 0 };
}

/** The check of a finished step draws itself when the step finishes. */
function DrawnCheck() {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <span className='chip-3d inline-flex size-[18px] items-center justify-center rounded-full [--chip:var(--primary)]'>
      <svg aria-hidden='true' viewBox='0 0 12 12' className='size-3'>
        <motion.path
          d={CHECK_PATH}
          fill='none'
          stroke='currentColor'
          strokeWidth='1.9'
          strokeLinecap='round'
          strokeLinejoin='round'
          initial={strokeStartOf(shouldReduceMotion)}
          animate={{ pathLength: 1 }}
          transition={DRAW}
        />
      </svg>
    </span>
  );
}

function StepGlyph({ status }: { status: StepStatus }) {
  if (status === 'done') {
    return <DrawnCheck />;
  }
  if (status === 'running') {
    return <LoaderIcon className='text-primary-ink size-4 animate-spin' />;
  }
  if (status === 'skipped') {
    return <MinusIcon className='text-muted-foreground size-4' />;
  }
  return (
    <span className='hairline-ring ring-foreground/25 size-[14px] rounded-full' />
  );
}

const STEP_WORD: Record<StepStatus, string> = {
  upcoming: 'Upcoming',
  running: 'Running',
  done: 'Done',
  failed: 'Failed',
  skipped: 'Skipped',
};

function stepTextOf(status: StepStatus) {
  if (status === 'upcoming') {
    return 'text-muted-foreground';
  }
  if (status === 'skipped') {
    return 'text-muted-foreground line-through';
  }
  return 'text-foreground';
}

function PlanRow({ step }: { step: PlanStep }) {
  return (
    <li className='flex h-8 items-center gap-2.5 text-[13px]'>
      <span className='flex size-[18px] shrink-0 items-center justify-center'>
        <Swap swapKey={step.status}>
          <StepGlyph status={step.status} />
        </Swap>
        <span className='sr-only'>{STEP_WORD[step.status]}</span>
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate transition-colors duration-200',
          stepTextOf(step.status)
        )}
      >
        {step.title}
      </span>
    </li>
  );
}

function CallTile({ brand }: { brand: BrandSlug | undefined }) {
  if (brand) {
    return <BrandTile brand={brand} size='lg' />;
  }
  return (
    <span className='keycap-3d text-muted-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-md'>
      <BlocksIcon className='size-3.5' />
    </span>
  );
}

function CallRow({
  call,
  brand,
}: {
  call: ToolCall;
  brand: BrandSlug | undefined;
}) {
  const isRunning = call.status === 'running';

  return (
    <div className='flex h-10 items-center gap-2.5 text-[13px]'>
      <CallTile brand={brand} />
      <span className='min-w-0 flex-1 truncate'>{call.label}</span>
      <LiveDuration
        item={call}
        isRunning={isRunning}
        className='text-muted-foreground w-10 shrink-0 text-end text-xs'
      />
      <CallStatusMark status={call.status} />
    </div>
  );
}

export function doneStepsOf(run: RunSnapshot) {
  const done = run.plan.filter((step) => step.status === 'done');
  return done.length;
}

type RunPanelProps = {
  run: RunSnapshot;
  /** The mark of the product behind each tool, by tool name. */
  brands?: Record<string, BrandSlug>;
  className?: string;
};

export function RunPanel({ run, brands = {}, className }: RunPanelProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const hasStarted = run.status !== 'idle';
  const hasCalls = run.calls.length > 0;

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <div className='flex items-end justify-between gap-3'>
        <div className='flex flex-col gap-1'>
          <span className='text-muted-foreground text-xs'>Cost so far</span>
          <MotionNumber
            value={run.usage.costUsd}
            format={COST_FORMAT}
            className='text-2xl leading-none font-semibold'
          />
        </div>
        <div className='flex flex-col items-end gap-1 text-xs'>
          <Swap swapKey={run.status} className='font-medium'>
            {RUN_WORD[run.status]}
          </Swap>
          <LiveDuration
            item={run}
            isRunning={isLive(run.status)}
            className='text-muted-foreground w-12 text-end'
          />
        </div>
      </div>

      {!hasStarted && (
        <p className='text-muted-foreground bg-foreground/[0.04] rounded-lg p-3 text-[13px]'>
          The plan, each tool call and the cost show up here once you send.
        </p>
      )}

      {hasStarted && (
        <section aria-label='Plan' className='flex flex-col gap-1'>
          <h3 className='text-muted-foreground text-xs'>Plan</h3>
          <ol className='flex flex-col'>
            {run.plan.map((step) => (
              <PlanRow key={step.id} step={step} />
            ))}
          </ol>
        </section>
      )}

      {hasCalls && (
        <section aria-label='Tool calls' className='flex flex-col gap-1'>
          <h3 className='text-muted-foreground text-xs'>Tool calls</h3>
          <ul className='flex flex-col'>
            <AnimatePresence initial={false}>
              {run.calls.map((call) => (
                <motion.li
                  key={call.id}
                  className='overflow-hidden'
                  {...rowPresence}
                >
                  <CallRow call={call} brand={brands[call.tool]} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}

      <p className='text-muted-foreground mt-auto text-xs'>
        Illustrative costs and durations
      </p>
    </div>
  );
}
