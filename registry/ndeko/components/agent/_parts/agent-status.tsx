'use client';

import { WordRoll } from '@/components/core/word-roll';
import type { AgentStatus as AgentState } from '@/registry/ndeko/lib/agent-run';
import { cn } from '@/registry/ndeko/lib/utils';

export const AGENT_STATUS_WORD: Record<AgentState, string> = {
  idle: 'Idle',
  running: 'Running',
  waiting: 'Waiting on you',
  failed: 'Failed',
  done: 'Done',
};

export const AGENT_STATES: AgentState[] = [
  'idle',
  'running',
  'waiting',
  'failed',
  'done',
];

const STATUS_WORDS = AGENT_STATES.map((state) => AGENT_STATUS_WORD[state]);

const DOT_TONE: Record<AgentState, string> = {
  idle: 'bg-muted-foreground/45',
  running: 'bg-info',
  waiting: 'bg-warning',
  failed: 'bg-destructive',
  done: 'bg-success',
};

const LABEL_TONE: Record<AgentState, string> = {
  idle: 'text-muted-foreground',
  running: 'text-foreground',
  waiting: 'text-warning-foreground',
  failed: 'text-destructive-ink',
  done: 'text-muted-foreground',
};

const DOT_SIZE = {
  sm: 'size-1.5',
  md: 'size-2',
  lg: 'size-2.5',
} as const;

export type AgentStatusSize = keyof typeof DOT_SIZE;

const BREATH: React.CSSProperties = { animationDuration: '2s' };

const SLOW_BLINK: React.CSSProperties = { animationDuration: '2.8s' };

function isLiveState(status: AgentState) {
  const isRunning = status === 'running';
  const isWaiting = status === 'waiting';
  return isRunning || isWaiting;
}

function pulseClassOf(status: AgentState) {
  if (isLiveState(status)) {
    return 'animate-pulse';
  }
  return undefined;
}

function pulseTimingOf(status: AgentState) {
  if (status === 'running') {
    return BREATH;
  }
  if (status === 'waiting') {
    return SLOW_BLINK;
  }
  return undefined;
}

function reservedLabelsOf(shouldReserve: boolean) {
  if (shouldReserve) {
    return STATUS_WORDS;
  }
  return undefined;
}

type AgentStatusDotProps = {
  status: AgentState;
  size?: AgentStatusSize;
  /** Without a visible word next to it, the dot says its state to screen readers. */
  isLabelled?: boolean;
  className?: string;
};

/**
 * Running breathes and sends a soft ring out, waiting blinks slowly, the others hold still.
 * The loops are CSS keyframes, which the theme stops under reduced motion.
 */
export function AgentStatusDot({
  status,
  size = 'md',
  isLabelled = false,
  className,
}: AgentStatusDotProps) {
  const isRunning = status === 'running';
  const word = AGENT_STATUS_WORD[status];

  return (
    <span
      data-status={status}
      className={cn('relative inline-flex shrink-0', DOT_SIZE[size], className)}
    >
      {isRunning && (
        <span
          aria-hidden='true'
          style={BREATH}
          className='bg-info/40 absolute inset-0 animate-ping rounded-full motion-reduce:hidden'
        />
      )}
      <span
        aria-hidden='true'
        style={pulseTimingOf(status)}
        className={cn(
          'relative size-full rounded-full transition-colors duration-200',
          DOT_TONE[status],
          pulseClassOf(status)
        )}
      />
      {isLabelled && <span className='sr-only'>{word}</span>}
    </span>
  );
}

export type AgentStatusProps = {
  status: AgentState;
  /** Leave the word out where space is short: the dot then carries it for screen readers. */
  showLabel?: boolean;
  /** Keeps the width of the longest word, so the row beside it never shifts. */
  reserveWidth?: boolean;
  size?: AgentStatusSize;
  className?: string;
};

export function AgentStatus({
  status,
  showLabel = true,
  reserveWidth = false,
  size = 'md',
  className,
}: AgentStatusProps) {
  const word = AGENT_STATUS_WORD[status];
  const labels = reservedLabelsOf(reserveWidth);

  if (!showLabel) {
    return (
      <AgentStatusDot
        status={status}
        size={size}
        isLabelled
        className={className}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs transition-colors duration-200',
        LABEL_TONE[status],
        className
      )}
    >
      <AgentStatusDot status={status} size={size} />
      <WordRoll text={word} labels={labels} />
    </span>
  );
}
