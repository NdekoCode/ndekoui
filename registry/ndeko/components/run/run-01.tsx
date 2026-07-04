'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import type { RunScriptStep } from '@/registry/ndeko/hooks/use-agent-run';
import {
  emptyRun,
  type CallStatus,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
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
import { useDemoRun } from '@/registry/ndeko/hooks/use-demo-run';
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
    <LiveDuration
      item={call}
      isRunning={isRunning}
      className='text-muted-foreground text-xs'
    />
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
  defaultOpen?: boolean;
  className?: string;
};

export function ToolCallCard({
  call,
  attempt = 1,
  onRetry,
  defaultOpen = false,
  className,
}: ToolCallCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = useId();
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const isFailed = call.status === 'failed';
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
        className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-start outline-none focus-visible:ring-[3px]'
      >
        <CallStatusMark status={call.status} />
        <span className='flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2'>
          <span className='text-muted-foreground order-1 shrink-0 font-mono text-[11px] sm:order-none sm:text-xs'>
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
                >
                  <RotateCcwIcon />
                  Retry
                </Button>
              )}
            </div>
          </motion.div>
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
  defaultOpen?: boolean;
  className?: string;
};

export function ToolCallGroup({
  calls,
  attempts = {},
  onRetry,
  defaultOpen = true,
  className,
}: ToolCallGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const listId = useId();
  const shouldReduceMotion = useReducedMotion();
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
            className='text-muted-foreground text-xs'
          />
        )}
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
            chevronTurnOf(isOpen)
          )}
        />
      </button>
      <Fold open={isOpen} id={listId}>
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
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </Fold>
    </section>
  );
}

const RETRY_MS = 1300;

const INITIAL_RUN = emptyRun({ id: 'brightmoor-turn', title: RUN_TITLE });

const SCRIPT: RunScriptStep[] = [
  { after: 500, event: { type: 'run.started' } },
  {
    after: 200,
    event: {
      type: 'call.started',
      call: {
        id: 'search',
        tool: 'web_search',
        label: 'Searched the web for Brightmoor prices',
        status: 'running',
        input: SEARCH_INPUT,
      },
    },
  },
  {
    after: 150,
    event: {
      type: 'call.started',
      call: {
        id: 'page',
        tool: 'fetch_page',
        label: 'Read the Brightmoor pricing page',
        status: 'queued',
        input: PAGE_INPUT,
      },
    },
  },
  {
    after: 150,
    event: {
      type: 'call.started',
      call: {
        id: 'sheet',
        tool: 'read_sheet',
        label: 'Read the Q3 invoices spreadsheet',
        status: 'queued',
        input: SHEET_INPUT,
      },
    },
  },
  {
    after: 900,
    event: {
      type: 'call.updated',
      id: 'search',
      patch: { status: 'done', output: SEARCH_OUTPUT },
    },
  },
  {
    after: 0,
    event: { type: 'call.updated', id: 'page', patch: { status: 'running' } },
  },
  {
    after: 1100,
    event: {
      type: 'call.updated',
      id: 'page',
      patch: { status: 'failed', error: PAGE_ERROR },
    },
  },
  {
    after: 0,
    event: { type: 'call.updated', id: 'sheet', patch: { status: 'running' } },
  },
  {
    after: 800,
    event: {
      type: 'call.updated',
      id: 'sheet',
      patch: { status: 'done', output: SHEET_OUTPUT },
    },
  },
  { after: 0, event: { type: 'run.finished', status: 'done' } },
];

const RETRY_OUTPUTS: Record<string, unknown> = {
  page: PAGE_OUTPUT,
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
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const { schedule, clearAll } = useTimeouts();
  const { ref, isInView, snapshot, store, restart, isFinished } = useDemoRun(
    SCRIPT,
    {
      initial: INITIAL_RUN,
    }
  );
  const calls = snapshot.calls;
  const announcement = announcementOf(calls);

  function retry(callId: string) {
    setAttempts((current) => {
      const previous = current[callId] ?? 1;
      return { ...current, [callId]: previous + 1 };
    });
    store.dispatch({
      type: 'call.updated',
      id: callId,
      patch: {
        status: 'running',
        error: undefined,
        startedAt: undefined,
        endedAt: undefined,
      },
    });
    schedule(() => {
      store.dispatch({
        type: 'call.updated',
        id: callId,
        patch: { status: 'done', output: RETRY_OUTPUTS[callId] },
      });
    }, RETRY_MS);
  }

  function replay() {
    clearAll();
    setAttempts({});
    restart();
  }

  return (
    <div ref={ref} className='flex w-full max-w-[34rem] flex-col gap-2'>
      <ClockGate isActive={isInView}>
        <ToolCallGroup calls={calls} attempts={attempts} onRetry={retry} />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={isFinished} onReplay={replay} />
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}
