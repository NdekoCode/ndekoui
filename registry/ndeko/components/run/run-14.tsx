'use client';

import { AnimatePresence, motion } from 'motion/react';

import { WordRoll } from '@/components/core/word-roll';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  useSession,
  type SessionStep,
} from '@/registry/ndeko/hooks/use-session';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import {
  DatabaseIcon,
  ImageIcon,
  RotateCcwIcon,
  TableIcon,
  XIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { useInterval, useIsOwnClockOn } from './_parts/use-own-clock';

export type JobKind = 'index' | 'export' | 'resize';

export type JobStatus = 'running' | 'failed' | 'done';

export type BackgroundJob = {
  id: string;
  kind: JobKind;
  title: string;
  detail: string;
  status: JobStatus;
  /** From 0 to 100. */
  progress: number;
  secondsLeft?: number;
  error?: string;
};

const JOB_ICONS: Record<JobKind, Icon> = {
  index: DatabaseIcon,
  export: TableIcon,
  resize: ImageIcon,
};

const RING_SIZE = 32;

const RING_STROKE = 3;

const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;

const RING_CENTER = RING_SIZE / 2;

const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const FILL_TONE: Record<JobStatus, string> = {
  running: 'bg-primary',
  failed: 'bg-destructive',
  done: 'bg-success',
};

function queueShareOf(jobs: BackgroundJob[], finishedCount: number) {
  const batchSize = jobs.length + finishedCount;
  if (batchSize === 0) {
    return 0;
  }
  let progressed = finishedCount * 100;
  for (const job of jobs) {
    progressed += job.progress;
  }
  return progressed / (batchSize * 100);
}

function barStyleOf(progress: number): React.CSSProperties {
  const share = Math.min(1, Math.max(0, progress / 100));
  return { transform: `scaleX(${share})` };
}

function timeLeftOf(seconds: number | undefined) {
  if (seconds === undefined) {
    return '';
  }
  if (seconds < 60) {
    return `${seconds}s left`;
  }
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest}s left`;
}

function ringToneOf(isClosed: boolean) {
  if (isClosed) {
    return 'stroke-success';
  }
  return 'stroke-info';
}

type QueueRingProps = {
  share: number;
  isClosed: boolean;
};

function QueueRing({ share, isClosed }: QueueRingProps) {
  const dashOffset = CIRCUMFERENCE * (1 - share);
  const percent = Math.round(share * 100);
  const centerKey = String(isClosed);

  return (
    <span className='relative inline-flex size-8 shrink-0 items-center justify-center'>
      <svg
        aria-hidden='true'
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className='absolute inset-0 -rotate-90'
      >
        <circle
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_RADIUS}
          fill='none'
          strokeWidth={RING_STROKE}
          className='stroke-foreground/10'
        />
        <circle
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_RADIUS}
          fill='none'
          strokeWidth={RING_STROKE}
          strokeLinecap='round'
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className={cn(
            'transition-[stroke-dashoffset,stroke] duration-500 ease-(--ease-out-strong) motion-reduce:transition-none',
            ringToneOf(isClosed)
          )}
        />
      </svg>
      <Swap swapKey={centerKey} className='relative'>
        {isClosed && (
          <DrawnCheck tone='success' entrance='draw' label='All jobs done' />
        )}
        {!isClosed && (
          <span className='text-muted-foreground text-[10px] tabular-nums'>
            {percent}
          </span>
        )}
      </Swap>
    </span>
  );
}

function headerLineOf(jobs: BackgroundJob[], finishedCount: number) {
  const hasNothing = jobs.length === 0 && finishedCount === 0;
  if (hasNothing) {
    return 'No background jobs';
  }
  if (jobs.length === 0) {
    return 'All jobs are done';
  }
  const running = jobs.filter((job) => job.status === 'running');
  const failed = jobs.filter((job) => job.status === 'failed');
  const failedCount = failed.length;
  if (running.length === 0) {
    return `${countOf(failedCount, 'job')} failed`;
  }
  const runningWords = `${countOf(running.length, 'job')} running`;
  if (failedCount === 0) {
    return runningWords;
  }
  return `${runningWords}, ${failedCount} failed`;
}

function JobStatusLine({ job }: { job: BackgroundJob }) {
  if (job.status === 'running') {
    return (
      <span className='text-muted-foreground text-xs tabular-nums'>
        {timeLeftOf(job.secondsLeft)}
      </span>
    );
  }
  if (job.status === 'failed') {
    return <Badge variant='destructive'>Failed</Badge>;
  }
  return (
    <span className='text-success-foreground flex items-center gap-1.5 text-xs'>
      <DrawnCheck tone='success' entrance='draw' />
      Done
    </span>
  );
}

type JobRowProps = {
  job: BackgroundJob;
  isRetryPressed: boolean;
  onCancel?: (jobId: string) => void;
  onRetry?: (jobId: string) => void;
};

function JobRow({ job, isRetryPressed, onCancel, onRetry }: JobRowProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const Glyph = JOB_ICONS[job.kind];
  const isFailed = job.status === 'failed';
  const isDone = job.status === 'done';
  const canRetry = isFailed && onRetry !== undefined;
  const canCancel = !isDone && onCancel !== undefined;

  function cancel() {
    onCancel?.(job.id);
  }

  function retry() {
    onRetry?.(job.id);
  }

  return (
    <motion.li
      data-status={job.status}
      className='overflow-hidden'
      {...rowPresence}
    >
      <div className='grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-2'>
        <span className='keycap-3d text-muted-foreground inline-flex size-7 items-center justify-center rounded-md'>
          <Glyph className='size-4' />
        </span>
        <span className='flex min-w-0 flex-col'>
          <span className='truncate text-[13px] font-medium'>{job.title}</span>
          <span className='text-muted-foreground truncate text-xs'>
            {job.detail}
          </span>
        </span>
        <span className='flex items-center gap-1.5'>
          <Swap swapKey={job.status}>
            <JobStatusLine job={job} />
          </Swap>
          {canRetry && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              aria-label={`Retry ${job.title}`}
              onClick={retry}
              className={pressedQuietOf(isRetryPressed)}
            >
              <RotateCcwIcon />
              Retry
            </Button>
          )}
          {canCancel && (
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={`Cancel ${job.title}`}
              onClick={cancel}
              className='text-muted-foreground'
            >
              <XIcon />
            </Button>
          )}
        </span>
        <span
          role='progressbar'
          aria-label={`${job.title} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(job.progress)}
          className='bg-foreground/10 col-span-full h-1 overflow-hidden rounded-full'
        >
          <span
            style={barStyleOf(job.progress)}
            className={cn(
              'block h-full w-full origin-left rounded-full transition-[transform,background-color] duration-[400ms] ease-linear motion-reduce:transition-none',
              FILL_TONE[job.status]
            )}
          />
        </span>
        <AnimatePresence initial={false}>
          {isFailed && job.error && (
            <motion.span
              key='error'
              className='text-destructive-ink col-span-full block overflow-hidden text-xs leading-5'
              {...rowPresence}
            >
              {job.error}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.li>
  );
}

export type BackgroundTasksProps = {
  jobs: BackgroundJob[];
  /** How many jobs of this batch finished and already left the list. */
  finishedCount: number;
  onCancel?: (jobId: string) => void;
  onRetry?: (jobId: string) => void;
  /** The job whose Retry a demonstration holds down. */
  pressedRetryId?: string | null;
  className?: string;
};

export function BackgroundTasks({
  jobs,
  finishedCount,
  onCancel,
  onRetry,
  pressedRetryId = null,
  className,
}: BackgroundTasksProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const share = queueShareOf(jobs, finishedCount);
  const isEmpty = jobs.length === 0;
  const isClosed = isEmpty && finishedCount > 0;
  const headerLine = headerLineOf(jobs, finishedCount);

  return (
    <section
      aria-label='Background jobs'
      className={cn(
        'bg-card hairline-ring ring-border flex flex-col gap-2 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <header className='flex items-center gap-3'>
        <QueueRing share={share} isClosed={isClosed} />
        <div className='flex min-w-0 flex-col'>
          <h3 className='text-sm font-medium'>Background jobs</h3>
          <p className='text-muted-foreground min-w-0 truncate text-xs'>
            <WordRoll text={headerLine} />
          </p>
        </div>
      </header>
      <ul aria-label='Jobs' className='flex flex-col'>
        <AnimatePresence initial={false}>
          {jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              isRetryPressed={pressedRetryId === job.id}
              onCancel={onCancel}
              onRetry={onRetry}
            />
          ))}
        </AnimatePresence>
      </ul>
      <AnimatePresence initial={false}>
        {isClosed && (
          <motion.p
            key='empty'
            className='text-muted-foreground overflow-hidden text-xs leading-5'
            {...rowPresence}
          >
            Every job finished. Nothing runs in the background.
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}

const TICK_MS = 400;

const SECONDS_PER_TICK = TICK_MS / 1000;

/** A finished job shows its check for this many ticks, then leaves. */
const LEAVE_TICKS = 4;

type JobSpec = {
  id: string;
  kind: JobKind;
  title: string;
  detail: string;
  /** Percent of the job done each second. */
  rate: number;
  /** The first attempt stops here, with this error. */
  failsAt?: number;
  error?: string;
};

const SPECS: JobSpec[] = [
  {
    id: 'index',
    kind: 'index',
    title: 'Index the support docs',
    detail: '1,820 pages',
    rate: 14,
  },
  {
    id: 'export',
    kind: 'export',
    title: 'Export Q3 invoices',
    detail: '12,400 rows to CSV',
    rate: 20,
    failsAt: 60,
    error: 'The export host closed the connection',
  },
  {
    id: 'resize',
    kind: 'resize',
    title: 'Resize product photos',
    detail: '240 photos to 1600 px',
    rate: 11,
  },
];

type JobState = BackgroundJob & {
  rate: number;
  failsAt?: number;
  attempts: number;
  /** Ticks left before a finished job leaves the list. */
  leaveIn?: number;
};

type QueueState = {
  jobs: JobState[];
  finishedCount: number;
  isHandled: boolean;
};

type QueueAction =
  | { type: 'tick' }
  | { type: 'retry'; id: string }
  | { type: 'cancel'; id: string }
  | { type: 'hold' };

type QueueStep = SessionStep<QueueState, QueueAction>;

function secondsLeftOf(progress: number, rate: number) {
  const remaining = 100 - progress;
  return Math.ceil(remaining / rate);
}

function startedJob(spec: JobSpec): JobState {
  return {
    id: spec.id,
    kind: spec.kind,
    title: spec.title,
    detail: spec.detail,
    status: 'running',
    progress: 0,
    secondsLeft: secondsLeftOf(0, spec.rate),
    rate: spec.rate,
    failsAt: spec.failsAt,
    attempts: 0,
    error: undefined,
  };
}

const INITIAL: QueueState = {
  jobs: SPECS.map(startedJob),
  finishedCount: 0,
  isHandled: false,
};

function hasFailureAhead(job: JobState) {
  const isFirstAttempt = job.attempts === 0;
  const canFail = job.failsAt !== undefined;
  return isFirstAttempt && canFail;
}

function failedJob(job: JobState, failsAt: number, error: string): JobState {
  return {
    ...job,
    status: 'failed',
    progress: failsAt,
    secondsLeft: undefined,
    error,
  };
}

function ranJob(job: JobState): JobState {
  const progress = Math.min(100, job.progress + job.rate * SECONDS_PER_TICK);
  const failsAt = job.failsAt ?? 100;
  const stopsToFail = hasFailureAhead(job) && progress >= failsAt;
  if (stopsToFail) {
    const spec = SPECS.find((candidate) => candidate.id === job.id);
    const error = spec?.error ?? '';
    return failedJob(job, failsAt, error);
  }
  if (progress >= 100) {
    return {
      ...job,
      status: 'done',
      progress: 100,
      secondsLeft: undefined,
      leaveIn: LEAVE_TICKS,
    };
  }
  const secondsLeft = secondsLeftOf(progress, job.rate);
  return { ...job, progress, secondsLeft };
}

function agedJob(job: JobState): JobState {
  const leaveIn = (job.leaveIn ?? 0) - 1;
  return { ...job, leaveIn };
}

function hasLeft(job: JobState) {
  const isDone = job.status === 'done';
  const hasTimeRunOut = (job.leaveIn ?? 1) <= 0;
  return isDone && hasTimeRunOut;
}

function ticked(state: QueueState): QueueState {
  const advanced = state.jobs.map((job) => {
    if (job.status === 'running') {
      return ranJob(job);
    }
    if (job.status === 'done') {
      return agedJob(job);
    }
    return job;
  });
  const leavers = advanced.filter(hasLeft);
  const jobs = advanced.filter((job) => !hasLeft(job));
  const finishedCount = state.finishedCount + leavers.length;
  return { ...state, jobs, finishedCount };
}

function retried(state: QueueState, id: string): QueueState {
  const jobs = state.jobs.map((job) => {
    const isTarget = job.id === id;
    const isFailed = job.status === 'failed';
    if (!isTarget || !isFailed) {
      return job;
    }
    const status: JobStatus = 'running';
    return {
      ...job,
      status,
      progress: 0,
      secondsLeft: secondsLeftOf(0, job.rate),
      error: undefined,
      attempts: job.attempts + 1,
    };
  });
  return { ...state, jobs, isHandled: true };
}

function cancelled(state: QueueState, id: string): QueueState {
  const jobs = state.jobs.filter((job) => job.id !== id);
  return { ...state, jobs, isHandled: true };
}

function reducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case 'tick':
      return ticked(state);
    case 'retry':
      return retried(state, action.id);
    case 'cancel':
      return cancelled(state, action.id);
    case 'hold':
      return state;
  }
}

const TICKS_BEFORE_RETRY = 12;

const TICKS_AFTER_RETRY = 19;

function tickSteps(count: number): QueueStep[] {
  const steps: QueueStep[] = [];
  for (let index = 0; index < count; index += 1) {
    steps.push({ after: TICK_MS, by: 'demo', action: { type: 'tick' } });
  }
  return steps;
}

const SCRIPT: QueueStep[] = [
  { after: 900, by: 'demo', action: { type: 'tick' } },
  ...tickSteps(TICKS_BEFORE_RETRY),
  {
    after: 700,
    by: 'demo',
    press: 'retry',
    action: { type: 'retry', id: 'export' },
  },
  ...tickSteps(TICKS_AFTER_RETRY),
  { after: 4000, by: 'demo', action: { type: 'hold' } },
];

function restingStateOf() {
  let state = INITIAL;
  for (let index = 0; index < 9; index += 1) {
    state = ticked(state);
  }
  return state;
}

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: restingStateOf(),
  script: SCRIPT,
  loopAfter: 3000,
};

function announcementOf(state: QueueState) {
  const failed = state.jobs.find((job) => job.status === 'failed');
  if (failed) {
    return `${failed.title} failed. ${failed.error ?? ''}`;
  }
  const hasFinishedAll = state.jobs.length === 0 && state.finishedCount > 0;
  if (hasFinishedAll) {
    return 'Every job finished';
  }
  const running = state.jobs.filter((job) => job.status === 'running');
  return `${countOf(running.length, 'job')} running`;
}

function pressedIdOf(pressed: string | null) {
  if (pressed === 'retry') {
    return 'export';
  }
  return null;
}

export default function Run14() {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const isClockOn = useIsOwnClockOn({
    isInView,
    isAutoplaying,
    isHandled: state.isHandled,
  });
  const isBusy = state.jobs.some((job) => job.status !== 'failed');
  const isOver = state.jobs.length === 0 && state.finishedCount > 0;
  const canReplay = isOver && isFinished && !isAutoplaying;
  const announcement = announcementOf(state);

  function tick() {
    act({ type: 'tick' });
  }

  function retry(id: string) {
    act({ type: 'retry', id });
  }

  function cancel(id: string) {
    act({ type: 'cancel', id });
  }

  useInterval(tick, TICK_MS, isClockOn && isBusy);
  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[23rem] w-full max-w-[32rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <BackgroundTasks
          jobs={state.jobs}
          finishedCount={state.finishedCount}
          onCancel={cancel}
          onRetry={retry}
          pressedRetryId={pressedIdOf(pressed)}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={canReplay} onReplay={restart} />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
