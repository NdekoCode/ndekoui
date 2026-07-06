'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useRef, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  useSession,
  type SessionStep,
} from '@/registry/ndeko/hooks/use-session';
import {
  elapsedOf,
  emptyRun,
  formatDuration,
  seriesColorOf,
  type AgentStatus as AgentState,
  type ApprovalRequest,
  type RunAgent,
  type RunEvent,
  type RunSnapshot,
  type RunStatus,
  type SeriesSlot,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import {
  pressedSolidOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { hatchOf } from '@/registry/ndeko/lib/hatch';
import {
  CheckIcon,
  ChevronsUpDownIcon,
  ListCollapseIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
} from '@/registry/ndeko/lib/icons';
import {
  fadePresence,
  rowPresenceOf,
} from '@/registry/ndeko/lib/motion-presets';
import { applyBatchAt, restingOf } from '@/registry/ndeko/lib/run-session';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { CopyButton } from '@/registry/ndeko/ui/copy-button';
import {
  ClockGate,
  LiveDuration,
  useLiveNow,
} from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import { AgentStatusDot } from './_parts/agent-status';
import { AgentTile } from './_parts/agent-tile';
import { CostFigure } from './_parts/cost-figure';
import { CODER } from './_parts/crew';
import { DECIDE_AFTER_MS } from './_parts/demo';
import { focusLater } from './_parts/focus-later';
import { KeyedHeight } from './_parts/keyed-height';
import { ToolTile } from './_parts/tool-tile';

export type MonitorMode =
  'idle' | 'running' | 'waiting' | 'paused' | 'stopped' | 'done' | 'failed';

const MODE_WORD: Record<MonitorMode, string> = {
  idle: 'Not started',
  running: 'Running',
  waiting: 'Waiting on you',
  paused: 'Paused',
  stopped: 'Stopped',
  done: 'Done',
  failed: 'Failed',
};

const MODE_WORDS = Object.values(MODE_WORD);

const MODE_DOT: Record<MonitorMode, AgentState> = {
  idle: 'idle',
  running: 'running',
  waiting: 'waiting',
  paused: 'idle',
  stopped: 'idle',
  done: 'done',
  failed: 'failed',
};

const WAITING_PART: React.CSSProperties = {
  backgroundColor: 'color-mix(in oklab, var(--warning) 14%, transparent)',
  backgroundImage: hatchOf('var(--warning)', 60),
};

const FAILED_PART: React.CSSProperties = {
  backgroundColor: 'color-mix(in oklab, var(--destructive) 12%, transparent)',
  backgroundImage: hatchOf('var(--destructive)', 55),
};

/** A ticking duration keeps its width, so nothing beside it shifts ten times a second. */
const TICKING_TIME = 'inline-block min-w-8';

export function monitorModeOf(status: RunStatus, isPaused: boolean) {
  if (status === 'cancelled') {
    return 'stopped';
  }
  if (status === 'done') {
    return 'done';
  }
  if (status === 'failed') {
    return 'failed';
  }
  if (isPaused) {
    return 'paused';
  }
  if (status === 'waiting') {
    return 'waiting';
  }
  if (status === 'running') {
    return 'running';
  }
  return 'idle';
}

function isEndedMode(mode: MonitorMode) {
  const isDone = mode === 'done';
  const isStopped = mode === 'stopped';
  const isFailed = mode === 'failed';
  return isDone || isStopped || isFailed;
}

function isOpenCall(call: ToolCall) {
  const isRunning = call.status === 'running';
  const isWaiting = call.status === 'waiting';
  return isRunning || isWaiting;
}

function isFinishedCall(call: ToolCall) {
  const isDone = call.status === 'done';
  const isFailed = call.status === 'failed';
  return isDone || isFailed;
}

export function currentCallOf(calls: ToolCall[]) {
  const openCalls = calls.filter(isOpenCall);
  return openCalls.at(-1);
}

function pendingApprovalFor(
  approvals: ApprovalRequest[],
  call: ToolCall | undefined
) {
  if (!call) {
    return undefined;
  }
  return approvals.find((approval) => {
    const isForCall = approval.id === call.id;
    const isPending = approval.status === 'pending';
    return isForCall && isPending;
  });
}

function finishedDurationOf(call: ToolCall) {
  const end = call.endedAt ?? 0;
  const elapsed = elapsedOf(call, end);
  return formatDuration(elapsed);
}

function lowerFirst(text: string) {
  const first = text.charAt(0).toLowerCase();
  const rest = text.slice(1);
  return `${first}${rest}`;
}

type StripPart = {
  key: string;
  /** Where the part starts on the strip and how much of it is its own, both from 0 to 1. */
  start: number;
  share: number;
  isOpen: boolean;
  style: React.CSSProperties;
};

/**
 * The strip is drawn one step ahead and travels there at a constant speed, so one transition plays
 * per step and no part is ever laid out again. `GROW` below lasts exactly as long.
 */
const GROW_STEP_MS = 1000;

const MIN_PART_SHARE = 0.012;

const GROW =
  'transition-transform duration-1000 ease-linear motion-reduce:transition-none';

const GLIDE =
  'transition-transform duration-300 ease-(--ease-in-out-strong) motion-reduce:transition-none';

/** Without motion nothing travels, so nothing is drawn ahead of the present. */
function leadOf(isTicking: boolean, shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 0;
  }
  if (isTicking) {
    return GROW_STEP_MS;
  }
  return 0;
}

function travelOf(isTicking: boolean) {
  if (isTicking) {
    return GROW;
  }
  return GLIDE;
}

function solidPartOf(
  call: ToolCall,
  series: SeriesSlot,
  isCurrent: boolean
): React.CSSProperties {
  const color = seriesColorOf(series);
  if (call.status === 'failed') {
    return FAILED_PART;
  }
  if (isCurrent) {
    return { backgroundColor: color };
  }
  return { backgroundColor: `color-mix(in oklab, ${color} 42%, transparent)` };
}

function isGateCall(call: ToolCall, approvals: ApprovalRequest[]) {
  return approvals.some((approval) => approval.id === call.id);
}

/** A step that waited on a person keeps its hatch after the decision: the wait stays in the history. */
function partStyleOf(
  call: ToolCall,
  approvals: ApprovalRequest[],
  series: SeriesSlot,
  current: ToolCall | undefined
) {
  if (isGateCall(call, approvals)) {
    return WAITING_PART;
  }
  const isCurrent = call.id === current?.id;
  return solidPartOf(call, series, isCurrent);
}

function firstStartOf(calls: ToolCall[]) {
  for (const call of calls) {
    if (call.startedAt !== undefined) {
      return call.startedAt;
    }
  }
  return undefined;
}

function lastMomentOf(calls: ToolCall[], reach: number) {
  let last: number | undefined;
  for (const call of calls) {
    const hasStarted = call.startedAt !== undefined;
    if (!hasStarted) {
      continue;
    }
    const end = call.endedAt ?? reach;
    const previous = last ?? end;
    last = Math.max(previous, end);
  }
  return last ?? reach;
}

/**
 * Where the strip stops: the present while the agent works, the end of its last step once it rests.
 * A run that ended keeps the times it was given, which can be far from the clock of the page.
 */
function stripEndOf(calls: ToolCall[], reach: number, isTicking: boolean) {
  if (isTicking) {
    return reach;
  }
  return lastMomentOf(calls, reach);
}

/**
 * Every step sits where it happened in time. While the run fits in the window, a finished part
 * never moves and the open one only grows; a longer run takes the whole strip and every part
 * gives way.
 */
function stripPartsOf(
  calls: ToolCall[],
  approvals: ApprovalRequest[],
  series: SeriesSlot,
  current: ToolCall | undefined,
  reach: number,
  end: number,
  windowMs: number
) {
  const origin = firstStartOf(calls) ?? reach;
  const lived = end - origin;
  const whole = Math.max(1, lived, windowMs);
  const parts: StripPart[] = [];
  for (const call of calls) {
    const startedAt = call.startedAt;
    if (startedAt === undefined) {
      continue;
    }
    const sinceOrigin = Math.max(0, startedAt - origin);
    const elapsed = elapsedOf(call, reach);
    const share = elapsed / whole;
    parts.push({
      key: call.id,
      start: sinceOrigin / whole,
      share: Math.max(share, MIN_PART_SHARE),
      isOpen: isOpenCall(call),
      style: partStyleOf(call, approvals, series, current),
    });
  }
  return parts;
}

type PartFrameStyle = React.CSSProperties & {
  '--part-at': string;
  '--part-born': string;
};

type PartFillStyle = React.CSSProperties & { '--fill-at': string };

/**
 * A part is a window on the strip with its fill behind it: the window ends where the part ends and
 * the fill starts where it starts, so only what both cover shows. Two moves on `translate`, and a
 * hatch is never stretched the way a scale would stretch it. The places are custom properties read
 * by a class: a place written inline would win over the starting style a part is born from.
 */
function partFrameStyleOf(part: StripPart): PartFrameStyle {
  const end = part.start + part.share;
  const offset = (end - 1) * 100;
  const bornAt = (part.start - 1) * 100;
  return { '--part-at': `${offset}%`, '--part-born': `${bornAt}%` };
}

function partFillStyleOf(part: StripPart): PartFillStyle {
  const offset = (1 - part.share) * 100;
  return { ...part.style, '--fill-at': `${offset}%` };
}

function boundaryStyleOf(part: StripPart): React.CSSProperties {
  const offset = part.start * 100;
  return { transform: `translateX(${offset}%)` };
}

/** A step that is open starts from nothing, so it is seen growing from its first frame. */
function frameBirthOf(isOpen: boolean) {
  if (isOpen) {
    return 'starting:translate-x-(--part-born)';
  }
  return undefined;
}

function fillBirthOf(isOpen: boolean) {
  if (isOpen) {
    return 'starting:translate-x-full';
  }
  return undefined;
}

function TimeStrip({
  calls,
  approvals,
  series,
  current,
  isTicking,
  windowMs,
}: {
  calls: ToolCall[];
  approvals: ApprovalRequest[];
  series: SeriesSlot;
  current: ToolCall | undefined;
  isTicking: boolean;
  windowMs: number;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const now = useLiveNow(GROW_STEP_MS, isTicking);
  const lead = leadOf(isTicking, shouldReduceMotion);
  const reach = now + lead;
  const end = stripEndOf(calls, reach, isTicking);
  const parts = stripPartsOf(
    calls,
    approvals,
    series,
    current,
    reach,
    end,
    windowMs
  );
  const laterParts = parts.slice(1);
  const travel = travelOf(isTicking);

  return (
    <div
      aria-hidden='true'
      className='bg-foreground/[0.05] relative h-1.5 overflow-hidden rounded-full'
    >
      {parts.map((part) => (
        <span
          key={part.key}
          className={cn(
            'absolute inset-0 translate-x-(--part-at) overflow-hidden',
            travel,
            frameBirthOf(part.isOpen)
          )}
          style={partFrameStyleOf(part)}
        >
          <span
            className={cn(
              'absolute inset-0 translate-x-(--fill-at)',
              travel,
              fillBirthOf(part.isOpen)
            )}
            style={partFillStyleOf(part)}
          />
        </span>
      ))}
      {laterParts.map((part) => (
        <span
          key={part.key}
          className={cn('absolute inset-0', travel)}
          style={boundaryStyleOf(part)}
        >
          <span className='bg-card absolute inset-y-0 -left-px w-0.5' />
        </span>
      ))}
    </div>
  );
}

function CommandAsk({
  call,
  approval,
  isAllowPressed,
  onAllow,
  onDeny,
}: {
  call: ToolCall;
  approval: ApprovalRequest;
  isAllowPressed: boolean;
  onAllow?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
}) {
  const command = approval.command ?? call.label;
  const waitingSince = { startedAt: approval.requestedAt };

  return (
    <div className='flex flex-col gap-3 pt-3'>
      <div className='bg-foreground/[0.04] flex items-start gap-2 rounded-lg py-2 ps-3 pe-1.5'>
        <code className='min-w-0 flex-1 py-0.5 font-mono text-xs leading-5 break-all'>
          <span
            aria-hidden='true'
            className='text-muted-foreground select-none'
          >
            ${' '}
          </span>
          {command}
        </code>
        <CopyButton text={command} label='Copy the command' />
      </div>
      {approval.detail && (
        <p className='text-muted-foreground text-xs leading-5'>
          {approval.detail}
        </p>
      )}
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          size='sm'
          onClick={() => onAllow?.(approval.id)}
          className={pressedSolidOf(isAllowPressed)}
        >
          <CheckIcon />
          Allow
        </Button>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => onDeny?.(approval.id)}
        >
          Deny
        </Button>
        <span className='text-muted-foreground ms-auto text-xs'>
          Waiting{' '}
          <LiveDuration
            item={waitingSince}
            isRunning
            className={TICKING_TIME}
          />
        </span>
      </div>
    </div>
  );
}

function summaryOf(mode: MonitorMode, finishedCount: number) {
  const steps = countOf(finishedCount, 'step');
  if (mode === 'done') {
    return `Done after ${steps}`;
  }
  if (mode === 'stopped') {
    return `Stopped by you after ${steps}`;
  }
  if (mode === 'failed') {
    return `Failed after ${steps}`;
  }
  if (mode === 'idle') {
    return 'Waits for its first step';
  }
  return 'Thinking about the next step';
}

function stepTitleOf(call: ToolCall, pending: ApprovalRequest | undefined) {
  if (pending) {
    return pending.title;
  }
  return call.label;
}

/** What the agent is on: the step that runs, the request that waits, or a line on where it stands. */
function StepIdentity({
  agent,
  mode,
  current,
  pending,
  finishedCount,
  isTicking,
}: {
  agent: RunAgent;
  mode: MonitorMode;
  current: ToolCall | undefined;
  pending: ApprovalRequest | undefined;
  finishedCount: number;
  isTicking: boolean;
}) {
  if (!current) {
    return (
      <p className='flex min-h-11 items-center text-[15px] leading-6 font-medium'>
        {summaryOf(mode, finishedCount)}
      </p>
    );
  }
  const isAsking = pending !== undefined;

  return (
    <div className='flex min-h-11 items-start gap-3'>
      <ToolTile tool={current.tool} size='lg' />
      <div className='min-w-0 flex-1'>
        {isAsking && (
          <p className='text-warning-foreground text-xs leading-5'>
            {agent.name} needs your OK
          </p>
        )}
        {!isAsking && (
          <p className='text-muted-foreground flex items-baseline gap-2 text-xs leading-5'>
            <span className='font-mono'>{current.tool}</span>
            <LiveDuration
              item={current}
              isRunning={isTicking}
              className={TICKING_TIME}
            />
          </p>
        )}
        <p className='text-[15px] leading-6 font-medium text-balance'>
          {stepTitleOf(current, pending)}
        </p>
      </div>
    </div>
  );
}

function costNoteOf(isEnded: boolean) {
  if (isEnded) {
    return 'in total';
  }
  return 'so far';
}

/**
 * The figure of the monitor: what the agent has spent. It stays in place while the steps change
 * beside it, so it rolls once each time a step ends, and a last time when the run does.
 */
function MonitorFigure({ usd, isEnded }: { usd: number; isEnded: boolean }) {
  return (
    <div className='shrink-0 text-end'>
      <CostFigure usd={usd} className='text-2xl leading-8 font-medium' />
      <p className='text-muted-foreground text-xs'>{costNoteOf(isEnded)}</p>
    </div>
  );
}

function noteOf(call: ToolCall) {
  if (call.status === 'failed') {
    return call.error ?? '';
  }
  return '';
}

function FinishedSteps({ calls }: { calls: ToolCall[] }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const finished = calls.filter(isFinishedCall);
  const newestFirst = [...finished].reverse();
  const hasFinished = newestFirst.length > 0;

  return (
    <div className='flex flex-col gap-1'>
      <p className='text-muted-foreground text-xs font-medium'>
        Finished steps
      </p>
      {!hasFinished && (
        <p className='text-muted-foreground text-xs leading-6'>
          Each step lands here when it ends
        </p>
      )}
      <ol aria-label='Finished steps' className='flex flex-col'>
        <AnimatePresence initial={false}>
          {newestFirst.map((call) => {
            const isFailed = call.status === 'failed';
            const note = noteOf(call);
            const hasNote = note !== '';

            return (
              <motion.li
                key={call.id}
                className='overflow-hidden'
                {...rowPresence}
              >
                <div className='flex items-start gap-3 py-1'>
                  <ToolTile tool={call.tool} size='sm' />
                  <div className='min-w-0 flex-1'>
                    <p
                      className={cn(
                        'truncate text-[13px] leading-6',
                        isFailed && 'text-muted-foreground'
                      )}
                    >
                      {call.label}
                    </p>
                    {hasNote && (
                      <p className='text-destructive-ink text-xs'>{note}</p>
                    )}
                  </div>
                  <span className='text-muted-foreground shrink-0 text-xs leading-6 tabular-nums'>
                    {finishedDurationOf(call)}
                  </span>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </div>
  );
}

function FoldedBar({
  agent,
  mode,
  current,
  isTicking,
}: {
  agent: RunAgent;
  mode: MonitorMode;
  current: ToolCall | undefined;
  isTicking: boolean;
}) {
  const word = lowerFirst(MODE_WORD[mode]);

  return (
    <div className='flex min-h-11 items-center gap-2.5 py-2 ps-3.5 pe-12'>
      <AgentStatusDot status={MODE_DOT[mode]} />
      <p className='min-w-0 flex-1 truncate text-[13px] leading-5'>
        <span className='font-medium'>{agent.name}</span>,{' '}
        {current && (
          <>
            {lowerFirst(current.label)},{' '}
            <LiveDuration item={current} isRunning={isTicking} />,{' '}
          </>
        )}
        {!current && <>{word}, </>}
        <CostFigure usd={agent.costUsd ?? 0} />
      </p>
    </div>
  );
}

function pauseLabelOf(isPaused: boolean, name: string) {
  if (isPaused) {
    return `Resume ${name}`;
  }
  return `Pause ${name}`;
}

function foldLabelOf(isFolded: boolean) {
  if (isFolded) {
    return 'Unfold the monitor';
  }
  return 'Fold the monitor into a bar';
}

function IconAction({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={label}
            onClick={onClick}
            className={cn('text-muted-foreground', className)}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function canPauseIn(mode: MonitorMode) {
  const isRunning = mode === 'running';
  const isPaused = mode === 'paused';
  return isRunning || isPaused;
}

function canStopIn(mode: MonitorMode) {
  const canPause = canPauseIn(mode);
  const isWaiting = mode === 'waiting';
  return canPause || isWaiting;
}

const NO_APPROVALS: ApprovalRequest[] = [];

export type AgentMonitorProps = {
  agent: RunAgent;
  /** The agent's steps in order. An approval that gates a step shares its id. */
  calls: ToolCall[];
  status: RunStatus;
  approvals?: ApprovalRequest[];
  isPaused?: boolean;
  onPauseChange?: (isPaused: boolean) => void;
  onStop?: () => void;
  onAllow?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
  /**
   * How much time the strip spans from the first step. While the run fits in it a finished part
   * never moves and the open one only grows. Without it the strip follows the length of the run.
   */
  windowMs?: number;
  /** Shows Allow held down, for a demonstration that presses it. */
  isAllowPressed?: boolean;
  defaultFolded?: boolean;
  className?: string;
};

export function AgentMonitor({
  agent,
  calls,
  status,
  approvals = NO_APPROVALS,
  isPaused = false,
  onPauseChange,
  onStop,
  onAllow,
  onDeny,
  windowMs = 0,
  isAllowPressed = false,
  defaultFolded = false,
  className,
}: AgentMonitorProps) {
  const [isFolded, setIsFolded] = useState(defaultFolded);
  const rootRef = useRef<HTMLElement>(null);
  const bodyId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const fade = fadePresence();
  const mode = monitorModeOf(status, isPaused);
  const current = currentCallOf(calls);
  const pending = pendingApprovalFor(approvals, current);
  const isRunning = mode === 'running';
  const isWaiting = mode === 'waiting';
  const isTicking = isRunning || isWaiting;
  const finished = calls.filter(isFinishedCall);
  const showsPause = canPauseIn(mode);
  const showsStop = canStopIn(mode);
  const pauseLabel = pauseLabelOf(isPaused, agent.name);
  const foldLabel = foldLabelOf(isFolded);
  const currentKey = current?.id ?? 'rest';
  const pendingKey = pending?.id ?? 'free';
  const stepKey = `${currentKey}-${pendingKey}-${mode}`;
  const isAsking = current !== undefined && pending !== undefined;
  const cost = agent.costUsd ?? 0;

  function toggleFolded() {
    setIsFolded((value) => !value);
  }

  function togglePause() {
    onPauseChange?.(!isPaused);
  }

  function keepFocus() {
    focusLater(rootRef, '[data-monitor-toggle]');
  }

  function stop() {
    onStop?.();
    keepFocus();
  }

  function allow(approvalId: string) {
    onAllow?.(approvalId);
    keepFocus();
  }

  function deny(approvalId: string) {
    onDeny?.(approvalId);
    keepFocus();
  }

  return (
    <section
      ref={rootRef}
      aria-label={`${agent.name} at work`}
      className={cn(
        'bg-card hairline-ring ring-border relative rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        aria-expanded={!isFolded}
        aria-controls={bodyId}
        aria-label={foldLabel}
        onClick={toggleFolded}
        data-monitor-toggle
        className='text-muted-foreground absolute end-2.5 top-2.5 z-10'
      >
        <Swap swapKey={String(isFolded)}>
          {isFolded && <ChevronsUpDownIcon />}
          {!isFolded && <ListCollapseIcon />}
        </Swap>
      </Button>
      <KeyedHeight changeKey={String(isFolded)}>
        <div className='relative'>
          <AnimatePresence mode='popLayout' initial={false}>
            {isFolded && (
              <motion.div key='bar' {...fade}>
                <FoldedBar
                  agent={agent}
                  mode={mode}
                  current={current}
                  isTicking={isTicking}
                />
              </motion.div>
            )}
            {!isFolded && (
              <motion.div
                key='card'
                id={bodyId}
                className='flex flex-col gap-4 p-4'
                {...fade}
              >
                <header className='flex items-center gap-3 pe-9'>
                  <AgentTile
                    name={agent.name}
                    series={agent.series}
                    size='lg'
                  />
                  <div className='min-w-0 flex-1'>
                    <p className='flex items-baseline gap-2'>
                      <span className='text-sm font-medium'>{agent.name}</span>
                      <span className='text-muted-foreground truncate text-xs'>
                        {agent.model}
                      </span>
                    </p>
                    <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                      <AgentStatusDot status={MODE_DOT[mode]} size='sm' />
                      <WordRoll text={MODE_WORD[mode]} labels={MODE_WORDS} />
                    </p>
                  </div>
                  <div className='flex items-center'>
                    {showsPause && (
                      <IconAction label={pauseLabel} onClick={togglePause}>
                        <Swap swapKey={String(isPaused)}>
                          {isPaused && <PlayIcon />}
                          {!isPaused && <PauseIcon />}
                        </Swap>
                      </IconAction>
                    )}
                    {showsStop && (
                      <IconAction
                        label={`Stop ${agent.name}`}
                        onClick={stop}
                        className='hover:text-destructive-ink'
                      >
                        <StopIcon />
                      </IconAction>
                    )}
                  </div>
                </header>
                <div>
                  <div className='flex items-start gap-3'>
                    <div className='relative min-w-0 flex-1'>
                      <AnimatePresence mode='popLayout' initial={false}>
                        <motion.div key={stepKey} {...fade}>
                          <StepIdentity
                            agent={agent}
                            mode={mode}
                            current={current}
                            pending={pending}
                            finishedCount={finished.length}
                            isTicking={isTicking}
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <MonitorFigure usd={cost} isEnded={isEndedMode(mode)} />
                  </div>
                  <AnimatePresence initial={false}>
                    {isAsking && (
                      <motion.div
                        key={pending.id}
                        className='overflow-hidden'
                        {...rowPresence}
                      >
                        <CommandAsk
                          call={current}
                          approval={pending}
                          isAllowPressed={isAllowPressed}
                          onAllow={allow}
                          onDeny={deny}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <TimeStrip
                  calls={calls}
                  approvals={approvals}
                  series={agent.series}
                  current={current}
                  isTicking={isTicking}
                  windowMs={windowMs}
                />
                <FinishedSteps calls={calls} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </KeyedHeight>
    </section>
  );
}

const GATE_ID = 'tests-ask';

const ALLOWED_RUN_ID = 'tests-repeat';

const COMMAND = 'pnpm test checkout.spec.ts --repeat 20';

const GATE: ApprovalRequest = {
  id: GATE_ID,
  title: 'Run the checkout tests 20 times',
  risk: 'low',
  status: 'pending',
  agentId: CODER.id,
  command: COMMAND,
  detail:
    'It runs in the sandbox and writes only the test report. About 30 seconds.',
};

const INITIAL_RUN = emptyRun({
  id: 'coder-monitor',
  title: 'Fix the flaky checkout test',
  agents: [{ ...CODER, parentId: undefined, costUsd: 0 }],
});

function started(id: string, tool: string, label: string): RunEvent {
  return {
    type: 'call.started',
    call: { id, tool, label, status: 'running', agentId: CODER.id },
  };
}

function finished(id: string, label: string): RunEvent {
  return { type: 'call.updated', id, patch: { status: 'done', label } };
}

function spent(costUsd: number): RunEvent {
  return { type: 'agent.updated', id: CODER.id, patch: { costUsd } };
}

type MonitorState = {
  run: RunSnapshot;
  isPaused: boolean;
  pausedAt: number;
};

type MonitorAction =
  | { type: 'events'; events: RunEvent[] }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'allow'; approvalId: string }
  | { type: 'deny'; approvalId: string }
  | { type: 'stop' };

type MonitorStep = SessionStep<MonitorState, MonitorAction>;

const INITIAL: MonitorState = {
  run: INITIAL_RUN,
  isPaused: false,
  pausedAt: 0,
};

function withEvents(state: MonitorState, events: RunEvent[], now: number) {
  const run = applyBatchAt(state.run, { events }, now);
  return { ...state, run };
}

/** The time spent paused is not the step's: its start moves forward by as much when the agent resumes. */
function withResume(state: MonitorState, now: number): MonitorState {
  const resumed = { ...state, isPaused: false };
  const current = currentCallOf(state.run.calls);
  const startedAt = current?.startedAt;
  if (!current || startedAt === undefined) {
    return resumed;
  }
  const pausedFor = now - state.pausedAt;
  const shifted: RunEvent = {
    type: 'call.updated',
    id: current.id,
    patch: { startedAt: startedAt + pausedFor },
  };
  return withEvents(resumed, [shifted], now);
}

function withAllow(state: MonitorState, approvalId: string, now: number) {
  const events: RunEvent[] = [
    { type: 'approval.resolved', id: approvalId, decision: 'approved' },
    finished(GATE_ID, 'You allowed the 20 test runs'),
    started(ALLOWED_RUN_ID, 'shell', 'Running the checkout tests 20 times'),
  ];
  return withEvents(state, events, now);
}

function withDeny(state: MonitorState, approvalId: string, now: number) {
  const events: RunEvent[] = [
    { type: 'approval.resolved', id: approvalId, decision: 'denied' },
    {
      type: 'call.updated',
      id: GATE_ID,
      patch: {
        status: 'failed',
        label: 'Did not run the tests 20 times',
        error: 'Denied by you',
      },
    },
  ];
  return withEvents(state, events, now);
}

function withStop(state: MonitorState, now: number): MonitorState {
  const current = currentCallOf(state.run.calls);
  const events: RunEvent[] = [];
  if (current) {
    events.push({
      type: 'call.updated',
      id: current.id,
      patch: { status: 'failed', error: 'Stopped by you' },
    });
  }
  events.push(
    { type: 'agent.updated', id: CODER.id, patch: { status: 'idle' } },
    { type: 'run.finished', status: 'cancelled' }
  );
  const stopped = withEvents(state, events, now);
  return { ...stopped, isPaused: false };
}

function applyAt(
  state: MonitorState,
  action: MonitorAction,
  now: number
): MonitorState {
  if (action.type === 'pause') {
    return { ...state, isPaused: true, pausedAt: now };
  }
  if (action.type === 'resume') {
    return withResume(state, now);
  }
  if (action.type === 'allow') {
    return withAllow(state, action.approvalId, now);
  }
  if (action.type === 'deny') {
    return withDeny(state, action.approvalId, now);
  }
  if (action.type === 'stop') {
    return withStop(state, now);
  }
  return withEvents(state, action.events, now);
}

/** Times are stamped when an action lands, as a backend would stream it. */
function reducer(state: MonitorState, action: MonitorAction) {
  return applyAt(state, action, Date.now());
}

function landing(after: number, ...events: RunEvent[]): MonitorStep {
  return { after, action: { type: 'events', events } };
}

function isGateDecided(state: MonitorState) {
  const gate = state.run.calls.find((call) => call.id === GATE_ID);
  return gate?.status !== 'waiting';
}

/** The agent's steps wait while a person paused it, and for good once the run is stopped. */
function isHeld(state: MonitorState) {
  const isStopped = state.run.status === 'cancelled';
  return state.isPaused || isStopped;
}

const SCRIPT: MonitorStep[] = [
  landing(
    500,
    { type: 'run.started' },
    { type: 'agent.updated', id: CODER.id, patch: { status: 'running' } }
  ),
  landing(300, started('read-spec', 'read_file', 'Reading checkout.spec.ts')),
  landing(1300, finished('read-spec', 'Read checkout.spec.ts'), spent(0.004)),
  landing(400, started('run-tests', 'shell', 'Running the checkout tests')),
  landing(
    2600,
    finished('run-tests', 'Ran the checkout tests: 1 of 12 failed'),
    spent(0.011)
  ),
  landing(500, started('read-mock', 'read_file', 'Reading payment-mock.ts')),
  landing(1100, finished('read-mock', 'Read payment-mock.ts'), spent(0.016)),
  landing(
    400,
    started('edit-mock', 'edit_file', 'Raising the payment timeout to 8s')
  ),
  landing(
    1500,
    finished('edit-mock', 'Raised the payment timeout to 8s'),
    spent(0.024)
  ),
  landing(
    400,
    started(GATE_ID, 'shell', 'Asking to run the tests 20 times'),
    { type: 'call.updated', id: GATE_ID, patch: { status: 'waiting' } },
    { type: 'approval.requested', approval: GATE }
  ),
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'allow',
    action: { type: 'allow', approvalId: GATE_ID },
    isAnswered: isGateDecided,
  },
  landing(
    3000,
    finished(ALLOWED_RUN_ID, 'Ran the checkout tests 20 times: all passed'),
    spent(0.031)
  ),
  landing(
    500,
    started('changelog', 'edit_file', 'Writing the fix into CHANGELOG.md')
  ),
  landing(
    1200,
    finished('changelog', 'Wrote the fix into CHANGELOG.md'),
    spent(0.035)
  ),
  landing(300, started('commit', 'git', 'Committing the fix')),
  landing(
    900,
    finished('commit', 'Committed “Raise the payment mock timeout”'),
    spent(0.038),
    { type: 'agent.updated', id: CODER.id, patch: { status: 'done' } },
    { type: 'run.finished', status: 'done' }
  ),
];

/** The run takes about seventeen seconds with its approval, so every step fits in a strip that never moves. */
const WINDOW_MS = 18_000;

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: restingOf(INITIAL, SCRIPT, applyAt),
  script: SCRIPT,
  loopAfter: 3000,
  holdWhile: isHeld,
};

function announcementOf(run: RunSnapshot, isPaused: boolean) {
  const mode = monitorModeOf(run.status, isPaused);
  const current = currentCallOf(run.calls);
  const word = MODE_WORD[mode];
  if (!current) {
    return `${CODER.name}: ${word}`;
  }
  return `${CODER.name}: ${word}. ${current.label}`;
}

export default function Agent07() {
  const { ref, isInView, isAutoplaying, state, act, pressed, restart } =
    useSession(SESSION);
  const { run, isPaused } = state;
  const [agent] = run.agents;
  const isEnded = run.endedAt !== undefined;
  const canReplay = isEnded && !isAutoplaying;
  const announcement = announcementOf(run, isPaused);

  function changePause(shouldPause: boolean) {
    if (shouldPause) {
      act({ type: 'pause' });
      return;
    }
    act({ type: 'resume' });
  }

  function allow(approvalId: string) {
    act({ type: 'allow', approvalId });
  }

  function deny(approvalId: string) {
    act({ type: 'deny', approvalId });
  }

  function stop() {
    act({ type: 'stop' });
  }

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[31.5rem] w-full max-w-[30rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <AgentMonitor
          agent={agent}
          calls={run.calls}
          status={run.status}
          approvals={run.approvals}
          isPaused={isPaused}
          onPauseChange={changePause}
          onStop={stop}
          onAllow={allow}
          onDeny={deny}
          windowMs={WINDOW_MS}
          isAllowPressed={pressed === 'allow'}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-between gap-2 px-1'>
        <span className='text-muted-foreground text-xs'>
          Costs are illustrative
        </span>
        <ReplayButton isShown={canReplay} onReplay={restart} />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
