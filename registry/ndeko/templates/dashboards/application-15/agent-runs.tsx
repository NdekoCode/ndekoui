'use client';

import { useId } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import { AGENT, RUNS, type RunId, type RunStatus } from './data';
import type { Decision, RunLive } from './session';

const STATUS_WORD: Record<RunStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  waiting: 'Waiting on you',
  done: 'Done',
  failed: 'Failed',
};

const STATUS_WORDS = Object.values(STATUS_WORD);

const DOT_TONE: Record<RunStatus, string> = {
  queued: 'bg-muted-foreground/45',
  running: 'bg-info',
  waiting: 'bg-warning',
  done: 'bg-success',
  failed: 'bg-destructive',
};

const WORD_TONE: Record<RunStatus, string> = {
  queued: 'text-muted-foreground',
  running: 'text-foreground',
  waiting: 'text-warning-foreground',
  done: 'text-muted-foreground',
  failed: 'text-destructive-ink',
};

/** Only a run that is really running breathes. */
function pulseOf(status: RunStatus) {
  if (status === 'running') {
    return 'animate-pulse';
  }
  return undefined;
}

type AgentStatus = 'Waiting on you' | 'Working' | 'Idle';

const AGENT_WORDS: AgentStatus[] = ['Waiting on you', 'Working', 'Idle'];

function agentStatusOf(runs: Record<RunId, RunLive>): AgentStatus {
  const lives = Object.values(runs);
  const isWaiting = lives.some((live) => live.status === 'waiting');
  if (isWaiting) {
    return 'Waiting on you';
  }
  const isRunning = lives.some((live) => live.status === 'running');
  if (isRunning) {
    return 'Working';
  }
  return 'Idle';
}

const AGENT_DOT: Record<AgentStatus, string> = {
  'Waiting on you': 'bg-warning',
  Working: 'bg-info',
  Idle: 'bg-success',
};

function agentPulseOf(status: AgentStatus) {
  if (status === 'Working') {
    return 'animate-pulse';
  }
  return undefined;
}

type RunRowProps = {
  id: RunId;
  title: string;
  request?: string;
  live: RunLive;
  isAllowPressed: boolean;
  onDecide: (id: RunId, decision: Decision) => void;
};

function RunRow({
  id,
  title,
  request,
  live,
  isAllowPressed,
  onDecide,
}: RunRowProps) {
  const isWaiting = live.status === 'waiting';
  const hasNote = live.note !== '';
  const showsNote = hasNote && !isWaiting;

  function allow() {
    onDecide(id, 'approved');
  }

  function deny() {
    onDecide(id, 'denied');
  }

  return (
    <div
      data-run={id}
      tabIndex={-1}
      className='flex flex-col gap-0.5 px-2 py-2 outline-none'
    >
      <p className='flex items-baseline gap-3'>
        <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
          {title}
        </span>
        <span
          className={cn(
            'flex shrink-0 items-center gap-1.5 text-xs transition-colors duration-200',
            WORD_TONE[live.status]
          )}
        >
          <span
            aria-hidden='true'
            className={cn(
              'size-1.5 shrink-0 rounded-full transition-colors duration-200',
              DOT_TONE[live.status],
              pulseOf(live.status)
            )}
          />
          <WordRoll text={STATUS_WORD[live.status]} labels={STATUS_WORDS} />
        </span>
      </p>
      {showsNote && (
        <p
          key={live.note}
          className='text-muted-foreground text-xs transition-opacity duration-300 starting:opacity-0'
        >
          {live.note}
        </p>
      )}
      {isWaiting && (
        <div className='flex flex-wrap items-center gap-2 pt-1.5'>
          <span className='text-foreground/85 min-w-0 flex-1 text-xs'>
            {request}
          </span>
          <Button
            type='button'
            size='sm'
            aria-label={`Allow: ${request}`}
            onClick={allow}
            className={pressedSolidOf(isAllowPressed)}
          >
            Allow
          </Button>
          <Button
            type='button'
            size='sm'
            variant='outline'
            aria-label={`Deny: ${request}`}
            onClick={deny}
          >
            Deny
          </Button>
        </div>
      )}
    </div>
  );
}

type AgentRunsProps = {
  runs: Record<RunId, RunLive>;
  pressed: string | null;
  onDecide: (id: RunId, decision: Decision) => void;
};

export function AgentRuns({ runs, pressed, onDecide }: AgentRunsProps) {
  const titleId = useId();
  const status = agentStatusOf(runs);

  return (
    <section
      data-section='agent'
      aria-labelledby={titleId}
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex scroll-mt-4 flex-col gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex items-center gap-2.5'>
        <MeshTile
          seed={AGENT.name}
          color={seriesColorOf(AGENT.series)}
          size='lg'
        />
        <div className='flex min-w-0 flex-col leading-tight'>
          <h2 id={titleId} className='truncate text-sm font-medium'>
            {AGENT.name}
          </h2>
          <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
            <span
              aria-hidden='true'
              className={cn(
                'size-1.5 shrink-0 rounded-full transition-colors duration-200',
                AGENT_DOT[status],
                agentPulseOf(status)
              )}
            />
            <WordRoll text={status} labels={AGENT_WORDS} />
          </p>
        </div>
      </header>
      <AnimatedSize>
        <ul aria-label='Recent runs' className='-mx-2 flex flex-col'>
          {RUNS.map((seed) => (
            <li key={seed.id}>
              <RunRow
                id={seed.id}
                title={seed.title}
                request={seed.request}
                live={runs[seed.id]}
                isAllowPressed={pressed === 'allow'}
                onDecide={onDecide}
              />
            </li>
          ))}
        </ul>
      </AnimatedSize>
    </section>
  );
}
