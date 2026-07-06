'use client';

import type { CSSProperties } from 'react';

import { useNow } from '@/registry/ndeko/hooks/use-agent-run';
import {
  elapsedOf,
  formatDuration,
  seriesColorOf,
  type RunAgent,
  type RunSnapshot,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import { hatchOf } from '@/registry/ndeko/lib/hatch';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';

import { AgentTile } from './agent-parts';
import { AGENT_ORDER, toolMetaOf, WINDOW_MS } from './data';
import { callsOfAgent, isRunLive, runNowOf } from './model';
import { Panel } from './panel';

const THIRD_MS = WINDOW_MS / 3;

const TICKS = [0, THIRD_MS, THIRD_MS * 2];

const END_LABEL = `${WINDOW_MS / 1000}s`;

/** A call too short to see still shows: its bar is never thinner than this share of the window. */
const MIN_SHARE = 0.012;

const CLOCK_MS = 250;

const LABEL_WIDTH = 'w-36 @2xl:w-44';

function percent(value: number) {
  return `${value}%`;
}

function isLiveCall(call: ToolCall) {
  return call.status === 'running' || call.status === 'waiting';
}

function startOf(run: RunSnapshot) {
  return run.startedAt ?? 0;
}

type Span = {
  startShare: number;
  endAt: number;
};

function spanOf(run: RunSnapshot, call: ToolCall, runNow: number): Span {
  const callStart = call.startedAt ?? startOf(run);
  const sinceStart = Math.max(0, callStart - startOf(run));
  const startShare = Math.min(1, sinceStart / WINDOW_MS);
  if (isLiveCall(call)) {
    return { startShare, endAt: runNow };
  }
  return { startShare, endAt: call.endedAt ?? callStart };
}

function barStyleOf(
  call: ToolCall,
  span: Span,
  color: string,
  isWaiting: boolean
): CSSProperties {
  const callStart = call.startedAt ?? 0;
  const maxShare = 1 - span.startShare;
  const wanted = Math.max(MIN_SHARE, (span.endAt - callStart) / WINDOW_MS);
  let ratio = 0;
  if (maxShare > 0) {
    ratio = Math.min(1, wanted / maxShare);
  }
  const style: CSSProperties = {
    left: percent(span.startShare * 100),
    width: percent(maxShare * 100),
    transform: `scaleX(${ratio})`,
    backgroundColor: color,
  };
  if (isWaiting) {
    style.backgroundColor = 'transparent';
    style.backgroundImage = hatchOf(color, 70);
  }
  return style;
}

type CallBarProps = {
  run: RunSnapshot;
  call: ToolCall;
  color: string;
};

/** The only leaf that ticks: a bar of a live call grows with the clock, and a finished one holds its width. */
function CallBar({ run, call, color }: CallBarProps) {
  const isLive = isLiveCall(call);
  const now = useNow(CLOCK_MS, isLive);
  const runNow = runNowOf(run, now);
  const span = spanOf(run, call, runNow);
  const isWaiting = call.status === 'waiting';
  const isFailed = call.status === 'failed';
  const style = barStyleOf(call, span, color, isWaiting);

  return (
    <span
      style={style}
      className={cn(
        'absolute top-1.5 h-4 origin-left rounded-[3px] transition-transform duration-[250ms] ease-linear',
        isFailed && 'opacity-40'
      )}
    />
  );
}

type SpanBarProps = {
  run: RunSnapshot;
  calls: ToolCall[];
  color: string;
};

function SpanBar({ run, calls, color }: SpanBarProps) {
  const hasLiveCall = calls.some(isLiveCall);
  const now = useNow(CLOCK_MS, hasLiveCall);
  const runNow = runNowOf(run, now);
  const starts = calls.map((call) => call.startedAt ?? startOf(run));
  const first = Math.min(...starts);
  const ends = calls.map((call) => {
    if (isLiveCall(call)) {
      return runNow;
    }
    return call.endedAt ?? first;
  });
  const last = Math.max(...ends);
  const startShare = Math.min(1, Math.max(0, first - startOf(run)) / WINDOW_MS);
  const maxShare = 1 - startShare;
  const wanted = Math.max(MIN_SHARE, (last - first) / WINDOW_MS);
  let ratio = 0;
  if (maxShare > 0) {
    ratio = Math.min(1, wanted / maxShare);
  }
  const style: CSSProperties = {
    left: percent(startShare * 100),
    width: percent(maxShare * 100),
    transform: `scaleX(${ratio})`,
    backgroundColor: `color-mix(in oklab, ${color} 22%, transparent)`,
  };

  return (
    <span
      style={style}
      className='absolute top-2.5 h-2 origin-left rounded-[3px] transition-transform duration-[250ms] ease-linear'
    />
  );
}

function CallClock({ call }: { call: ToolCall }) {
  if (call.status === 'running') {
    return <LiveDuration item={call} isRunning className='w-10 text-end' />;
  }
  if (call.status === 'done') {
    const elapsed = elapsedOf(call, call.endedAt ?? 0);
    return (
      <span className='w-10 text-end tabular-nums'>
        {formatDuration(elapsed)}
      </span>
    );
  }
  return <span className='w-10' />;
}

function dimOf(isDimmed: boolean) {
  if (isDimmed) {
    return 'opacity-40';
  }
  return undefined;
}

type AgentRowsProps = {
  run: RunSnapshot;
  agent: RunAgent;
  isDimmed: boolean;
};

function AgentRows({ run, agent, isDimmed }: AgentRowsProps) {
  const calls = callsOfAgent(run, agent.id);
  if (calls.length === 0) {
    return null;
  }
  const color = seriesColorOf(agent.series);

  return (
    <li
      className={cn(
        'flex flex-col transition-opacity duration-200',
        dimOf(isDimmed)
      )}
    >
      <div className='flex h-7 items-center'>
        <span
          className={cn('flex shrink-0 items-center gap-2 pe-2', LABEL_WIDTH)}
        >
          <AgentTile agent={agent} size='sm' />
          <span className='min-w-0 truncate text-[13px] font-medium'>
            {agent.name}
          </span>
        </span>
        <span className='relative h-7 min-w-0 flex-1'>
          <SpanBar run={run} calls={calls} color={color} />
        </span>
      </div>
      <ul className='flex flex-col'>
        {calls.map((call) => (
          <li
            key={call.id}
            className='flex h-7 items-center transition-opacity duration-300 starting:opacity-0'
          >
            <span
              className={cn(
                'text-muted-foreground flex shrink-0 items-center gap-2 ps-6 pe-2 text-xs',
                LABEL_WIDTH
              )}
            >
              <span className='min-w-0 flex-1 truncate'>
                {call.label}
                <span className='sr-only'>, {toolMetaOf(call.tool).name}</span>
              </span>
              <CallClock call={call} />
            </span>
            <span className='relative h-7 min-w-0 flex-1'>
              <CallBar run={run} call={call} color={color} />
            </span>
          </li>
        ))}
      </ul>
    </li>
  );
}

function Playhead({ run }: { run: RunSnapshot }) {
  const now = useNow(CLOCK_MS, isRunLive(run));
  if (run.startedAt === undefined) {
    return null;
  }
  const runNow = runNowOf(run, now);
  const end = run.endedAt ?? runNow;
  const elapsed = Math.max(0, end - run.startedAt);
  const share = Math.min(1, elapsed / WINDOW_MS);
  const style = { transform: `translateX(${share * 100}cqw)` };

  return (
    <span
      aria-hidden='true'
      style={style}
      className='bg-primary absolute inset-y-0 left-0 w-px transition-transform duration-[250ms] ease-linear'
    />
  );
}

function bandToneOf(index: number) {
  if (index % 2 === 0) {
    return 'bg-foreground/[0.03]';
  }
  return undefined;
}

type WaterfallProps = {
  run: RunSnapshot;
  focusAgentId: string | null;
  className?: string;
};

export function Waterfall({ run, focusAgentId, className }: WaterfallProps) {
  const hasFocus = focusAgentId !== null;
  const isEmpty = run.calls.length === 0;

  return (
    <Panel
      panel='waterfall'
      title='Trace'
      className={className}
      meta={
        <span className='text-muted-foreground text-xs tabular-nums'>
          {countOf(run.calls.length, 'call')}
        </span>
      }
    >
      <div className='relative -mx-1 overflow-x-auto px-1 pb-1'>
        <div className='relative min-w-[32rem]'>
          <div className='flex h-6 items-end'>
            <span className={cn('shrink-0', LABEL_WIDTH)} />
            <div className='relative h-full min-w-0 flex-1 [direction:ltr]'>
              {TICKS.map((tick, index) => (
                <span
                  key={tick}
                  style={{ left: percent((tick * 100) / WINDOW_MS) }}
                  className='text-muted-foreground absolute bottom-0.5 text-xs tabular-nums'
                >
                  {index === 0 && '0s'}
                  {index > 0 && `${tick / 1000}s`}
                </span>
              ))}
              <span className='text-muted-foreground absolute right-0 bottom-0.5 text-xs tabular-nums'>
                {END_LABEL}
              </span>
            </div>
          </div>
          <div
            aria-hidden='true'
            className={cn(
              'pointer-events-none absolute top-6 right-0 bottom-0 flex [direction:ltr]',
              'left-36 @2xl:left-44'
            )}
          >
            {TICKS.map((tick, index) => (
              <span
                key={tick}
                className={cn('h-full flex-1', bandToneOf(index))}
              />
            ))}
          </div>
          <div
            className={cn(
              '[container-type:inline-size] pointer-events-none absolute top-6 right-0 bottom-0 [direction:ltr]',
              'left-36 @2xl:left-44'
            )}
          >
            <Playhead run={run} />
          </div>
          <ul aria-label='Calls by agent' className='relative flex flex-col'>
            {AGENT_ORDER.map((id) => {
              const agent = run.agents.find((candidate) => candidate.id === id);
              if (!agent) {
                return null;
              }
              const isDimmed = hasFocus && focusAgentId !== id;
              return (
                <AgentRows
                  key={id}
                  run={run}
                  agent={agent}
                  isDimmed={isDimmed}
                />
              );
            })}
          </ul>
          {isEmpty && (
            <p className='text-muted-foreground relative py-6 text-center text-xs'>
              No call yet. Each call shows here as a bar on the time axis.
            </p>
          )}
        </div>
      </div>
    </Panel>
  );
}
