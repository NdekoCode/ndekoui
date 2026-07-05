'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  useSession,
  type SessionStep,
} from '@/registry/ndeko/hooks/use-session';
import {
  emptyRun,
  reduceRun,
  type CallStatus,
  type RunEvent,
  type RunSnapshot,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { ChevronDownIcon, RotateCcwIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';

import {
  CALL_STATUS_WORD,
  CallStatusMark,
} from '@/registry/ndeko/ui/call-status';
import { CopyButton } from '@/registry/ndeko/ui/copy-button';
import { JsonView, jsonTextOf } from '@/registry/ndeko/ui/json-view';
import { ClockGate, LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Collapse } from './_parts/collapse';
import { applyBatchAt, restingOf } from './_parts/run-session';
import {
  PAGE_ERROR,
  PAGE_INPUT,
  PAGE_OUTPUT,
  RUN_TITLE,
  SEARCH_INPUT,
  SEARCH_OUTPUT,
  SHEET_INPUT,
  SHEET_OUTPUT,
} from './_parts/scenario';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

function isActiveStatus(status: CallStatus) {
  const isQueued = status === 'queued';
  const isRunning = status === 'running';
  const isWaiting = status === 'waiting';
  return isQueued || isRunning || isWaiting;
}

function retryWordOf(status: CallStatus) {
  if (status === 'running') {
    return 'Second try';
  }
  if (status === 'failed') {
    return 'Failed again';
  }
  return 'Retried';
}

/** A running call and a finished one share one key, so the clock keeps counting instead of swapping. */
function timeKeyOf(status: CallStatus) {
  if (status === 'queued') {
    return 'queued';
  }
  if (status === 'waiting') {
    return 'waiting';
  }
  return 'timed';
}

/** A duration that ticks keeps its width, so nothing beside it shifts ten times a second. */
const TICKING_TIME =
  'text-muted-foreground inline-block min-w-8 text-end text-xs';

function CallTime({ call }: { call: ToolCall }) {
  const isRunning = call.status === 'running';
  const hasStarted = call.startedAt !== undefined;
  if (call.status === 'queued') {
    return <span className='text-muted-foreground text-xs'>Queued</span>;
  }
  if (call.status === 'waiting') {
    return <span className='text-warning-foreground text-xs'>Waiting</span>;
  }
  if (!hasStarted) {
    return null;
  }
  return (
    <LiveDuration item={call} isRunning={isRunning} className={TICKING_TIME} />
  );
}

function SectionHeader({
  title,
  copyText,
  copyLabel,
}: {
  title: string;
  copyText: string;
  copyLabel: string;
}) {
  return (
    <div className='flex h-6 items-center justify-between gap-2'>
      <span className='text-muted-foreground text-xs font-medium'>{title}</span>
      <CopyButton text={copyText} label={copyLabel} />
    </div>
  );
}

function CallDetails({ call }: { call: ToolCall }) {
  const inputText = jsonTextOf(call.input ?? {});
  const outputText = jsonTextOf(call.output);
  const hasOutput = call.output !== undefined;
  const isFailed = call.status === 'failed';
  const isPending = isActiveStatus(call.status);

  return (
    <div className='flex flex-col gap-2.5 ps-9 pe-2 pb-3'>
      <div>
        <SectionHeader
          title='Arguments'
          copyText={inputText}
          copyLabel={`Copy the arguments of ${call.tool}`}
        />
        <JsonView value={call.input ?? {}} />
      </div>
      {hasOutput && (
        <div>
          <SectionHeader
            title='Result'
            copyText={outputText}
            copyLabel={`Copy the result of ${call.tool}`}
          />
          <JsonView value={call.output} />
        </div>
      )}
      {isFailed && (
        <div>
          <SectionHeader
            title='Error'
            copyText={call.error ?? ''}
            copyLabel={`Copy the error of ${call.tool}`}
          />
          <p className='bg-destructive/10 text-destructive-ink rounded-lg p-2.5 font-mono text-xs leading-relaxed'>
            {call.error}
          </p>
        </div>
      )}
      {isPending && (
        <p className='text-muted-foreground text-xs'>
          The result shows here once the call returns
        </p>
      )}
    </div>
  );
}

export type ToolCallCardProps = {
  call: ToolCall;
  /** How many times the call has run. From the second, the row says it was retried. */
  attempt?: number;
  onRetry?: (callId: string) => void;
  /** One line on what came back. It slides in under the call when it is done. */
  resultLine?: string;
  /** Shows Retry held down, for a demonstration that presses it. */
  isRetryPressed?: boolean;
  defaultOpen?: boolean;
  className?: string;
};

export function ToolCallCard({
  call,
  attempt = 1,
  onRetry,
  resultLine,
  isRetryPressed = false,
  defaultOpen = false,
  className,
}: ToolCallCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const isFailed = call.status === 'failed';
  const isDone = call.status === 'done';
  const hasResultLine = resultLine !== undefined;
  const showsResult = isDone && hasResultLine;
  const wasRetried = attempt > 1;
  const retryWord = retryWordOf(call.status);
  const canRetry = onRetry !== undefined;

  function toggle() {
    setIsOpen((current) => !current);
  }

  function retry() {
    onRetry?.(call.id);
  }

  return (
    <div data-status={call.status} className={cn('rounded-lg', className)}>
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={toggle}
        className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 @container flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-start outline-none focus-visible:ring-[3px]'
      >
        <CallStatusMark status={call.status} />
        <span className='flex min-w-0 flex-1 flex-col gap-0.5 @md:flex-row @md:items-baseline @md:gap-2'>
          <span className='text-muted-foreground order-1 shrink-0 font-mono text-[11px] @md:order-none @md:text-xs'>
            {call.tool}
          </span>
          <span className='min-w-0 truncate text-[13px]'>{call.label}</span>
        </span>
        {wasRetried && (
          <Badge variant='secondary'>
            <Swap swapKey={retryWord}>{retryWord}</Swap>
          </Badge>
        )}
        <Swap swapKey={timeKeyOf(call.status)} className='shrink-0'>
          <CallTime call={call} />
        </Swap>
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
            chevronTurnOf(isOpen)
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isFailed && (
          <motion.div key='error' className='overflow-hidden' {...rowPresence}>
            <div className='flex items-center gap-3 ps-9 pe-2 pb-2'>
              <p className='text-destructive-ink min-w-0 flex-1 text-xs leading-5'>
                {call.error}
              </p>
              {canRetry && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={retry}
                  aria-label={`Retry ${call.tool}`}
                  className={pressedQuietOf(isRetryPressed)}
                >
                  <RotateCcwIcon />
                  Retry
                </Button>
              )}
            </div>
          </motion.div>
        )}
        {showsResult && (
          <motion.p
            key='result'
            className='text-muted-foreground overflow-hidden text-xs'
            {...rowPresence}
          >
            <span className='block truncate ps-9 pe-2 pb-2 leading-5'>
              {resultLine}
            </span>
          </motion.p>
        )}
      </AnimatePresence>
      <Fold open={isOpen} id={panelId}>
        <CallDetails call={call} />
      </Fold>
    </div>
  );
}

type GroupStatus = 'queued' | 'running' | 'failed' | 'done';

function groupStatusOf(calls: ToolCall[]): GroupStatus {
  if (calls.length === 0) {
    return 'queued';
  }
  const hasActive = calls.some((call) => isActiveStatus(call.status));
  if (hasActive) {
    return 'running';
  }
  const hasFailed = calls.some((call) => call.status === 'failed');
  if (hasFailed) {
    return 'failed';
  }
  return 'done';
}

function toolWordOf(count: number) {
  if (count === 1) {
    return '1 tool';
  }
  return `${count} tools`;
}

function verbOf(status: GroupStatus) {
  if (status === 'running') {
    return 'Using';
  }
  return 'Used';
}

function groupSummaryOf(calls: ToolCall[]) {
  const status = groupStatusOf(calls);
  if (status === 'queued') {
    return 'Waiting for the first tool';
  }
  const verb = verbOf(status);
  const tools = toolWordOf(calls.length);
  const failedCalls = calls.filter((call) => call.status === 'failed');
  const failedCount = failedCalls.length;
  if (failedCount === 0) {
    return `${verb} ${tools}`;
  }
  return `${verb} ${tools}, ${failedCount} failed`;
}

type Span = { startedAt?: number; endedAt?: number };

function earlierOf(current: number | undefined, candidate: number) {
  if (current === undefined) {
    return candidate;
  }
  return Math.min(current, candidate);
}

function laterOf(current: number | undefined, candidate: number) {
  if (current === undefined) {
    return candidate;
  }
  return Math.max(current, candidate);
}

function spanOf(calls: ToolCall[]): Span {
  let startedAt: number | undefined;
  let endedAt: number | undefined;
  for (const call of calls) {
    if (call.startedAt !== undefined) {
      startedAt = earlierOf(startedAt, call.startedAt);
    }
    if (call.endedAt !== undefined) {
      endedAt = laterOf(endedAt, call.endedAt);
    }
  }
  const hasActive = calls.some((call) => isActiveStatus(call.status));
  if (hasActive) {
    return { startedAt };
  }
  return { startedAt, endedAt };
}

export type ToolCallGroupProps = {
  calls: ToolCall[];
  attempts?: Record<string, number>;
  onRetry?: (callId: string) => void;
  /** One line per call id on what came back, shown under the call once it is done. */
  resultLines?: Record<string, string>;
  /** The call whose Retry a demonstration holds down. */
  pressedRetryId?: string | null;
  defaultOpen?: boolean;
  className?: string;
};

export function ToolCallGroup({
  calls,
  attempts = {},
  onRetry,
  resultLines = {},
  pressedRetryId = null,
  defaultOpen = true,
  className,
}: ToolCallGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const listId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const status = groupStatusOf(calls);
  const summary = groupSummaryOf(calls);
  const span = spanOf(calls);
  const isRunning = status === 'running';
  const hasStarted = span.startedAt !== undefined;

  function toggle() {
    setIsOpen((current) => !current);
  }

  return (
    <section
      aria-label='Tool calls'
      className={cn(
        'bg-card hairline-ring ring-border rounded-xl p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={toggle}
        className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex h-9 w-full cursor-pointer items-center gap-3 rounded-lg px-2 text-start outline-none focus-visible:ring-[3px]'
      >
        <CallStatusMark status={status} />
        <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
          <WordRoll text={summary} />
        </span>
        {hasStarted && (
          <LiveDuration
            item={span}
            isRunning={isRunning}
            className={TICKING_TIME}
          />
        )}
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
            chevronTurnOf(isOpen)
          )}
        />
      </button>
      <Collapse open={isOpen} id={listId}>
        <ul className='flex flex-col'>
          <AnimatePresence initial={false}>
            {calls.map((call) => (
              <motion.li
                key={call.id}
                className='overflow-hidden'
                {...rowPresence}
              >
                <ToolCallCard
                  call={call}
                  attempt={attempts[call.id] ?? 1}
                  onRetry={onRetry}
                  resultLine={resultLines[call.id]}
                  isRetryPressed={pressedRetryId === call.id}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </Collapse>
    </section>
  );
}

const RETRY_MS = 1300;

/** A call that waits on a person is retried by the demonstration after this long. */
const RETRY_AFTER_MS = 2500;

const INITIAL_RUN = emptyRun({ id: 'brightmoor-turn', title: RUN_TITLE });

const RETRY_OUTPUTS: Record<string, unknown> = {
  page: PAGE_OUTPUT,
};

const RESULT_LINES: Record<string, string> = {
  search: '5 results, the price list first',
  page: 'Wholesale pricing, 3 tables',
  sheet: '117 rows, $48,210.50 in total',
};

type CallsState = {
  run: RunSnapshot;
  attempts: Record<string, number>;
};

type CallsAction =
  | { type: 'events'; events: RunEvent[] }
  | { type: 'retry'; callId: string }
  | { type: 'retried'; callId: string };

type CallsStep = SessionStep<CallsState, CallsAction>;

const INITIAL: CallsState = { run: INITIAL_RUN, attempts: {} };

function callOf(state: CallsState, callId: string) {
  return state.run.calls.find((call) => call.id === callId);
}

function attemptOf(state: CallsState, callId: string) {
  return state.attempts[callId] ?? 1;
}

function withRetry(state: CallsState, callId: string, now: number) {
  const call = callOf(state, callId);
  const isFailed = call?.status === 'failed';
  if (!isFailed) {
    return state;
  }
  const previous = attemptOf(state, callId);
  const attempts = { ...state.attempts, [callId]: previous + 1 };
  const event: RunEvent = {
    type: 'call.updated',
    id: callId,
    patch: {
      status: 'running',
      error: undefined,
      startedAt: undefined,
      endedAt: undefined,
    },
  };
  const run = reduceRun(state.run, event, now);
  return { run, attempts };
}

/** The script and the hand of a person may both land the same retry: only the first one counts. */
function withRetryLanded(state: CallsState, callId: string, now: number) {
  const call = callOf(state, callId);
  const isRunning = call?.status === 'running';
  const attempt = attemptOf(state, callId);
  const wasRetried = attempt > 1;
  const isRetrying = isRunning && wasRetried;
  if (!isRetrying) {
    return state;
  }
  const event: RunEvent = {
    type: 'call.updated',
    id: callId,
    patch: { status: 'done', output: RETRY_OUTPUTS[callId] },
  };
  const run = reduceRun(state.run, event, now);
  return { ...state, run };
}

function applyAt(
  state: CallsState,
  action: CallsAction,
  now: number
): CallsState {
  if (action.type === 'retry') {
    return withRetry(state, action.callId, now);
  }
  if (action.type === 'retried') {
    return withRetryLanded(state, action.callId, now);
  }
  const run = applyBatchAt(state.run, action, now);
  return { ...state, run };
}

/** Times are stamped when an action lands, as a backend would stream it. */
function reducer(state: CallsState, action: CallsAction) {
  return applyAt(state, action, Date.now());
}

function landing(after: number, ...events: RunEvent[]): CallsStep {
  return { after, action: { type: 'events', events } };
}

function hasRetriedPage(state: CallsState) {
  const attempt = attemptOf(state, 'page');
  return attempt > 1;
}

const SCRIPT: CallsStep[] = [
  landing(500, { type: 'run.started' }),
  landing(200, {
    type: 'call.started',
    call: {
      id: 'search',
      tool: 'web_search',
      label: 'Searched the web for Brightmoor prices',
      status: 'running',
      input: SEARCH_INPUT,
    },
  }),
  landing(150, {
    type: 'call.started',
    call: {
      id: 'page',
      tool: 'fetch_page',
      label: 'Read the Brightmoor pricing page',
      status: 'queued',
      input: PAGE_INPUT,
    },
  }),
  landing(150, {
    type: 'call.started',
    call: {
      id: 'sheet',
      tool: 'read_sheet',
      label: 'Read the Q3 invoices spreadsheet',
      status: 'queued',
      input: SHEET_INPUT,
    },
  }),
  landing(
    900,
    {
      type: 'call.updated',
      id: 'search',
      patch: { status: 'done', output: SEARCH_OUTPUT },
    },
    { type: 'call.updated', id: 'page', patch: { status: 'running' } }
  ),
  landing(
    1100,
    {
      type: 'call.updated',
      id: 'page',
      patch: { status: 'failed', error: PAGE_ERROR },
    },
    { type: 'call.updated', id: 'sheet', patch: { status: 'running' } }
  ),
  landing(
    800,
    {
      type: 'call.updated',
      id: 'sheet',
      patch: { status: 'done', output: SHEET_OUTPUT },
    },
    { type: 'run.finished', status: 'done' }
  ),
  {
    after: RETRY_AFTER_MS,
    by: 'person',
    press: 'page',
    action: { type: 'retry', callId: 'page' },
    isAnswered: hasRetriedPage,
  },
  { after: RETRY_MS, action: { type: 'retried', callId: 'page' } },
];

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: restingOf(INITIAL, SCRIPT, applyAt),
  script: SCRIPT,
  loopAfter: 3000,
};

function lastChangeOf(call: ToolCall) {
  if (call.endedAt !== undefined) {
    return call.endedAt;
  }
  if (call.startedAt !== undefined) {
    return call.startedAt;
  }
  return -Infinity;
}

function latestOf(calls: ToolCall[]) {
  let latest: ToolCall | undefined;
  let latestTime = -Infinity;
  for (const call of calls) {
    const time = lastChangeOf(call);
    if (time >= latestTime) {
      latest = call;
      latestTime = time;
    }
  }
  return latest;
}

function announcementOf(calls: ToolCall[]) {
  const latest = latestOf(calls);
  if (!latest) {
    return '';
  }
  const word = CALL_STATUS_WORD[latest.status];
  return `${latest.label}: ${word}`;
}

export default function Run01() {
  const { schedule, clearAll } = useTimeouts();
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
  const calls = state.run.calls;
  const announcement = announcementOf(calls);
  const canReplay = isFinished && !isAutoplaying;

  function retry(callId: string) {
    act({ type: 'retry', callId });
    schedule(() => act({ type: 'retried', callId }), RETRY_MS);
  }

  function replay() {
    clearAll();
    restart();
  }

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[22rem] w-full max-w-[34rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <ToolCallGroup
          calls={calls}
          attempts={state.attempts}
          onRetry={retry}
          resultLines={RESULT_LINES}
          pressedRetryId={pressed}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={canReplay} onReplay={replay} />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
