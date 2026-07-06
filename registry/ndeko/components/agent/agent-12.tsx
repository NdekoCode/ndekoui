'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  useSession,
  type SessionStep,
} from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import type { RunAgent } from '@/registry/ndeko/lib/agent-run';
import {
  pressedQuietOf,
  pressedSolidOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  LoaderIcon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  XIcon,
  ZapIcon,
} from '@/registry/ndeko/lib/icons';
import { SPRING } from '@/registry/ndeko/lib/motion-presets';
import { restingOf } from '@/registry/ndeko/lib/run-session';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { ClockGate, useLiveNow } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { AgentTile } from './_parts/agent-tile';
import { WRITER } from './_parts/crew';

export type RunMarkStatus = 'done' | 'failed' | 'skipped' | 'running';

export type RunMark = {
  id: string;
  status: RunMarkStatus;
  /** When the run happened, in a few words: "Mon 9 Nov". */
  when: string;
  /** What to say of the run, in a few words: "Done in 38 s". */
  note: string;
};

const MARK_LOOK: Record<RunMarkStatus, string> = {
  done: 'bg-success/15 text-success-foreground',
  failed: 'bg-destructive/15 text-destructive-ink',
  skipped: 'bg-foreground/[0.06] text-muted-foreground',
  running: 'bg-info/15 text-info-foreground',
};

const MARK_WORD: Record<RunMarkStatus, string> = {
  done: 'Done',
  failed: 'Failed',
  skipped: 'Skipped',
  running: 'Running',
};

const MARK_KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

const MINUTE_MS = 60_000;

const HOUR_MS = 60 * MINUTE_MS;

function markGlyphOf(status: RunMarkStatus) {
  if (status === 'done') {
    return <CheckIcon className='size-3' />;
  }
  if (status === 'failed') {
    return <XIcon className='size-3' />;
  }
  if (status === 'skipped') {
    return <MinusIcon className='size-3' />;
  }
  return <LoaderIcon className='size-3 animate-spin' />;
}

function markLabelOf(run: RunMark) {
  const word = MARK_WORD[run.status];
  return `${run.when}: ${word}. ${run.note}`;
}

function untilOf(milliseconds: number) {
  if (milliseconds <= 0) {
    return 'any moment';
  }
  const hours = Math.floor(milliseconds / HOUR_MS);
  const minutes = Math.floor((milliseconds % HOUR_MS) / MINUTE_MS);
  if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  }
  const seconds = Math.floor((milliseconds % MINUTE_MS) / 1000);
  return `in ${minutes}m ${seconds}s`;
}

/** The clock reads 0 until the page is live, so the countdown holds a dash instead of a wrong time. */
function NextRunIn({ at }: { at: number }) {
  const now = useLiveNow(1000, true);
  const hasClock = now > 0;
  if (!hasClock) {
    return <span className='tabular-nums'>-</span>;
  }
  return <span className='tabular-nums'>{untilOf(at - now)}</span>;
}

function summaryOf(runs: RunMark[]) {
  const doneCount = runs.filter((run) => run.status === 'done').length;
  return `${doneCount} of ${runs.length} runs done`;
}

function readoutOf(active: RunMark | undefined, runs: RunMark[]) {
  if (active) {
    return markLabelOf(active);
  }
  return summaryOf(runs);
}

function tabStopOf(runs: RunMark[], tabStopId: string | null) {
  const known = runs.find((run) => run.id === tabStopId);
  if (known) {
    return known.id;
  }
  const last = runs[runs.length - 1];
  return last?.id;
}

function tabIndexOf(isTabStop: boolean) {
  if (isTabStop) {
    return 0;
  }
  return -1;
}

function targetIndexOf(key: string, index: number, count: number) {
  if (key === 'Home') {
    return 0;
  }
  if (key === 'End') {
    return count - 1;
  }
  if (key === 'ArrowLeft') {
    return Math.max(0, index - 1);
  }
  return Math.min(count - 1, index + 1);
}

function markPresenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return {
    initial: { opacity: 0, x: 14, scale: 0.8 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -14, scale: 0.8 },
  };
}

type RunMarksProps = {
  runs: RunMark[];
};

function RunMarks({ runs }: RunMarksProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [tabStopId, setTabStopId] = useState<string | null>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = markPresenceOf(shouldReduceMotion);
  const activeId = hoveredId ?? focusedId;
  const active = runs.find((run) => run.id === activeId);
  const tabStop = tabStopOf(runs, tabStopId);
  const order = runs.map((run) => run.id).join(' ');
  const readout = readoutOf(active, runs);

  function moveFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    const isMarkKey = MARK_KEYS.includes(event.key);
    const group = groupRef.current;
    if (!isMarkKey || !group) {
      return;
    }
    const buttons = Array.from(group.querySelectorAll('button'));
    const current = buttons.findIndex((button) => button === event.target);
    if (current < 0) {
      return;
    }
    event.preventDefault();
    const target = targetIndexOf(event.key, current, buttons.length);
    buttons[target]?.focus();
  }

  return (
    <div className='flex flex-col gap-2'>
      <div
        ref={groupRef}
        role='group'
        aria-label={`Last ${runs.length} runs`}
        onKeyDown={moveFocus}
        className='relative flex items-center'
      >
        <AnimatePresence mode='popLayout' initial={false}>
          {runs.map((run) => (
            <motion.span
              key={run.id}
              layout='position'
              layoutDependency={order}
              transition={SPRING}
              className='inline-flex'
              {...presence}
            >
              <button
                type='button'
                aria-label={markLabelOf(run)}
                tabIndex={tabIndexOf(run.id === tabStop)}
                onPointerEnter={() => setHoveredId(run.id)}
                onPointerLeave={() => setHoveredId(null)}
                onFocus={() => {
                  setFocusedId(run.id);
                  setTabStopId(run.id);
                }}
                onBlur={() => setFocusedId(null)}
                className='focus-visible:ring-ring/25 inline-flex size-7 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px]'
              >
                <span
                  className={cn(
                    'inline-flex size-5 items-center justify-center rounded-[5px] transition-colors duration-200',
                    MARK_LOOK[run.status]
                  )}
                >
                  <Swap swapKey={run.status}>{markGlyphOf(run.status)}</Swap>
                </span>
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <p className='text-muted-foreground min-h-5 text-xs leading-5'>
        {readout}
      </p>
    </div>
  );
}

export type ScheduledAgentProps = {
  agent: Pick<RunAgent, 'name' | 'series'>;
  task: string;
  /** The schedule in words: "Every weekday at 9:00". */
  schedule: string;
  /** The same schedule as a cron expression: "0 9 * * 1-5". */
  cron: string;
  /** When the next run starts, in milliseconds. */
  nextRunAt: number;
  isPaused: boolean;
  /** The last runs, oldest first. */
  runs: RunMark[];
  onPausedChange?: (isPaused: boolean) => void;
  onRunNow?: () => void;
  /** Shows Pause held down, for a demonstration that presses it. */
  isPausePressed?: boolean;
  /** Shows Run now held down, for a demonstration that presses it. */
  isRunPressed?: boolean;
  className?: string;
};

const PAUSE_GLYPH = <PauseIcon />;

const RESUME_GLYPH = <PlayIcon />;

function pauseGlyphOf(isPaused: boolean) {
  if (isPaused) {
    return RESUME_GLYPH;
  }
  return PAUSE_GLYPH;
}

function pauseLabelOf(isPaused: boolean) {
  if (isPaused) {
    return 'Resume';
  }
  return 'Pause';
}

type StatusBadge = {
  label: string;
  variant: React.ComponentProps<typeof Badge>['variant'];
};

const PAUSED_BADGE: StatusBadge = { label: 'Paused', variant: 'secondary' };

const ACTIVE_BADGE: StatusBadge = { label: 'Active', variant: 'success' };

function statusBadgeOf(isPaused: boolean) {
  if (isPaused) {
    return PAUSED_BADGE;
  }
  return ACTIVE_BADGE;
}

function nextLineToneOf(isPaused: boolean) {
  if (isPaused) {
    return 'opacity-45';
  }
  return 'opacity-100';
}

export function ScheduledAgent({
  agent,
  task,
  schedule,
  cron,
  nextRunAt,
  isPaused,
  runs,
  onPausedChange,
  onRunNow,
  isPausePressed = false,
  isRunPressed = false,
  className,
}: ScheduledAgentProps) {
  const pauseLabel = pauseLabelOf(isPaused);
  const badge = statusBadgeOf(isPaused);
  const isRunning = runs.some((run) => run.status === 'running');
  const pauseGlyph = pauseGlyphOf(isPaused);

  function togglePause() {
    onPausedChange?.(!isPaused);
  }

  return (
    <section
      aria-label={`${agent.name}, scheduled`}
      className={cn(
        'bg-card hairline-ring ring-border @container flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <header className='flex items-start gap-3'>
        <AgentTile name={agent.name} series={agent.series} size='lg' />
        <div className='flex min-w-0 flex-1 flex-col'>
          <h3 className='truncate text-sm font-medium'>{agent.name}</h3>
          <p className='text-muted-foreground text-xs leading-5'>{task}</p>
        </div>
        <Swap swapKey={badge.label}>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </Swap>
      </header>
      <div className='bg-foreground/[0.04] dark:bg-foreground/[0.06] flex flex-col gap-2.5 rounded-lg p-3'>
        <p className='flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px]'>
          <CalendarIcon className='text-muted-foreground size-4 shrink-0' />
          <span>{schedule}</span>
          <code className='bg-foreground/[0.06] text-muted-foreground inline-flex h-5 items-center rounded-md px-1.5 font-mono text-[11px]'>
            {cron}
          </code>
        </p>
        <p
          className={cn(
            'flex items-center gap-2.5 text-[13px] transition-opacity duration-200',
            nextLineToneOf(isPaused)
          )}
        >
          <ClockIcon className='text-muted-foreground size-4 shrink-0' />
          <span className='text-muted-foreground'>Next run</span>
          <Swap swapKey={String(isPaused)}>
            {isPaused && <span>Paused</span>}
            {!isPaused && <NextRunIn at={nextRunAt} />}
          </Swap>
        </p>
      </div>
      <RunMarks runs={runs} />
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={togglePause}
          className={pressedQuietOf(isPausePressed)}
        >
          <Swap swapKey={pauseLabel}>{pauseGlyph}</Swap>
          <Swap swapKey={pauseLabel}>{pauseLabel}</Swap>
        </Button>
        <Button
          type='button'
          size='sm'
          disabled={isRunning}
          focusableWhenDisabled
          onClick={onRunNow}
          className={pressedSolidOf(isRunPressed)}
        >
          <ZapIcon />
          Run now
        </Button>
      </div>
    </section>
  );
}

const SCHEDULE = 'Every weekday at 9:00';

const CRON = '0 9 * * 1-5';

const TASK = 'Writes the weekly digest of supplier price changes';

const NEXT_RUN_IN_MS = 3 * HOUR_MS + 12 * MINUTE_MS;

const RUN_MS = 1900;

const MAX_MARKS = 7;

type ScheduleState = {
  isPaused: boolean;
  runs: RunMark[];
  nextRunNumber: number;
};

type ScheduleAction =
  | { type: 'paused'; isPaused: boolean }
  | { type: 'run' }
  | { type: 'finish' }
  | { type: 'hold' };

type ScheduleStep = SessionStep<ScheduleState, ScheduleAction>;

const PAST_RUNS: RunMark[] = [
  { id: 'run-1', status: 'done', when: 'Fri 30 Oct', note: 'Done in 38 s' },
  { id: 'run-2', status: 'done', when: 'Mon 2 Nov', note: 'Done in 41 s' },
  { id: 'run-3', status: 'done', when: 'Tue 3 Nov', note: 'Done in 36 s' },
  {
    id: 'run-4',
    status: 'skipped',
    when: 'Wed 4 Nov',
    note: 'The run before it was still going',
  },
  { id: 'run-5', status: 'done', when: 'Thu 5 Nov', note: 'Done in 44 s' },
  {
    id: 'run-6',
    status: 'failed',
    when: 'Fri 6 Nov',
    note: 'The supplier portal did not answer',
  },
  { id: 'run-7', status: 'done', when: 'Mon 9 Nov', note: 'Done in 39 s' },
];

const INITIAL: ScheduleState = {
  isPaused: false,
  runs: PAST_RUNS,
  nextRunNumber: 8,
};

function started(state: ScheduleState): ScheduleState {
  const isBusy = state.runs.some((run) => run.status === 'running');
  if (isBusy) {
    return state;
  }
  const run: RunMark = {
    id: `run-${state.nextRunNumber}`,
    status: 'running',
    when: 'Today',
    note: 'Started with Run now',
  };
  const runs = [...state.runs, run].slice(-MAX_MARKS);
  return { ...state, runs, nextRunNumber: state.nextRunNumber + 1 };
}

function finished(state: ScheduleState): ScheduleState {
  const runs = state.runs.map((run) => {
    if (run.status !== 'running') {
      return run;
    }
    const status: RunMarkStatus = 'done';
    return { ...run, status, note: 'Done in 40 s' };
  });
  return { ...state, runs };
}

function reducer(state: ScheduleState, action: ScheduleAction): ScheduleState {
  switch (action.type) {
    case 'paused':
      return { ...state, isPaused: action.isPaused };
    case 'run':
      return started(state);
    case 'finish':
      return finished(state);
    case 'hold':
      return state;
  }
}

const SCRIPT: ScheduleStep[] = [
  {
    after: 1800,
    by: 'demo',
    press: 'pause',
    action: { type: 'paused', isPaused: true },
  },
  {
    after: 2000,
    by: 'demo',
    press: 'pause',
    action: { type: 'paused', isPaused: false },
  },
  {
    after: 1500,
    by: 'demo',
    press: 'run',
    action: { type: 'run' },
  },
  { after: RUN_MS, action: { type: 'finish' } },
  { after: 3800, action: { type: 'hold' } },
];

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: restingOf(INITIAL, SCRIPT, reducer),
  script: SCRIPT,
  loopAfter: 3000,
};

function announcementOf(state: ScheduleState) {
  const running = state.runs.some((run) => run.status === 'running');
  if (running) {
    return 'A run started';
  }
  if (state.isPaused) {
    return 'The schedule is paused';
  }
  return '';
}

export default function Agent12() {
  const { schedule, clearAll } = useTimeouts();
  const [nextRunAt] = useState(() => Date.now() + NEXT_RUN_IN_MS);
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
  const hasRunNow = state.runs.some((run) => run.when === 'Today');
  const canReplay = hasRunNow && isFinished && !isAutoplaying;
  const announcement = announcementOf(state);

  function changePaused(isPaused: boolean) {
    act({ type: 'paused', isPaused });
  }

  function runNow() {
    act({ type: 'run' });
    schedule(() => act({ type: 'finish' }), RUN_MS);
  }

  function replay() {
    clearAll();
    restart();
  }

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[27rem] w-full max-w-[30rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <ScheduledAgent
          agent={WRITER}
          task={TASK}
          schedule={SCHEDULE}
          cron={CRON}
          nextRunAt={nextRunAt}
          isPaused={state.isPaused}
          runs={state.runs}
          onPausedChange={changePaused}
          onRunNow={runNow}
          isPausePressed={pressed === 'pause'}
          isRunPressed={pressed === 'run'}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={canReplay} onReplay={replay} />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
