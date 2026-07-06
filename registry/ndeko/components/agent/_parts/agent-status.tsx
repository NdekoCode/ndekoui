'use client';

import { WordRoll } from '@/components/core/word-roll';
import type {
  AgentStatus as AgentState,
  RunAgent,
} from '@/registry/ndeko/lib/agent-run';
import {
  CircleCheckIcon,
  CircleXIcon,
  HandIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

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

const MARK_SIZE = {
  sm: 'size-3',
  md: 'size-3.5',
  lg: 'size-4',
} as const;

export type AgentStatusSize = keyof typeof DOT_SIZE;

const RING_TIMING: React.CSSProperties = { animationDuration: '2s' };

/** A piece lets this many dots pulse at once. Past it, a running agent is told by its colour and its word. */
export const MAX_PULSING = 3;

/** The running agents whose dot may pulse: the first ones, in the order given. */
export function pulsingIdsOf(
  agents: Pick<RunAgent, 'id' | 'status'>[],
  limit = MAX_PULSING
) {
  const running = agents.filter((agent) => agent.status === 'running');
  const pulsing = running.slice(0, limit);
  const ids = pulsing.map((agent) => agent.id);
  return new Set(ids);
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
  /** Holds a running dot still: where three others already pulse, or where nothing is really running. */
  isStill?: boolean;
  className?: string;
};

/**
 * A running dot sends a soft ring out: one CSS keyframe on transform and opacity, which the theme
 * stops under reduced motion. Every other state holds still and is told by its colour.
 */
export function AgentStatusDot({
  status,
  size = 'md',
  isLabelled = false,
  isStill = false,
  className,
}: AgentStatusDotProps) {
  const isRunning = status === 'running';
  const isPulsing = isRunning && !isStill;
  const word = AGENT_STATUS_WORD[status];

  return (
    <span
      data-status={status}
      className={cn('relative inline-flex shrink-0', DOT_SIZE[size], className)}
    >
      {isPulsing && (
        <span
          aria-hidden='true'
          style={RING_TIMING}
          className='bg-info/40 absolute inset-0 animate-ping rounded-full motion-reduce:hidden'
        />
      )}
      <span
        aria-hidden='true'
        className={cn(
          'relative size-full rounded-full transition-colors duration-200',
          DOT_TONE[status]
        )}
      />
      {isLabelled && <span className='sr-only'>{word}</span>}
    </span>
  );
}

type StatusGlyphProps = {
  status: AgentState;
  size: AgentStatusSize;
  isStill: boolean;
};

function StatusGlyph({ status, size, isStill }: StatusGlyphProps) {
  const box = MARK_SIZE[size];
  if (status === 'waiting') {
    return <HandIcon className={cn('text-warning-foreground', box)} />;
  }
  if (status === 'failed') {
    return <CircleXIcon className={cn('text-destructive-ink', box)} />;
  }
  if (status === 'done') {
    return <CircleCheckIcon className={cn('text-success-foreground', box)} />;
  }
  return (
    <span className={cn('flex items-center justify-center', box)}>
      <AgentStatusDot status={status} size={size} isStill={isStill} />
    </span>
  );
}

type AgentStatusMarkProps = {
  status: AgentState;
  size?: AgentStatusSize;
  isStill?: boolean;
  className?: string;
};

/**
 * The mark of a state, drawn so it reads without its colour: a dot while the agent is idle or runs,
 * a hand while it waits, a cross when it failed, a check when it ended. It swaps when the state changes.
 */
export function AgentStatusMark({
  status,
  size = 'md',
  isStill = false,
  className,
}: AgentStatusMarkProps) {
  const box = MARK_SIZE[size];

  return (
    <span
      data-status={status}
      aria-hidden='true'
      className={cn('inline-flex shrink-0', box, className)}
    >
      <Swap swapKey={status} className={box}>
        <StatusGlyph status={status} size={size} isStill={isStill} />
      </Swap>
    </span>
  );
}

export type AgentStatusProps = {
  status: AgentState;
  /** Leave the word out where space is short: a dot then carries it for screen readers. */
  showLabel?: boolean;
  /** Keeps the width of the longest word, so the row beside it never shifts. */
  reserveWidth?: boolean;
  size?: AgentStatusSize;
  /** Holds a running mark still: a piece lets three pulse at most. */
  isStill?: boolean;
  className?: string;
};

export function AgentStatus({
  status,
  showLabel = true,
  reserveWidth = false,
  size = 'md',
  isStill = false,
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
        isStill={isStill}
        className={className}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs transition-colors duration-200',
        LABEL_TONE[status],
        className
      )}
    >
      <AgentStatusMark status={status} size={size} isStill={isStill} />
      <WordRoll text={word} labels={labels} />
    </span>
  );
}
