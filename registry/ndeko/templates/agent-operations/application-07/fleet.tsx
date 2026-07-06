'use client';

import { WordRoll } from '@/components/core/word-roll';
import {
  elapsedOf,
  formatDuration,
  type RunAgent,
  type RunSnapshot,
} from '@/registry/ndeko/lib/agent-run';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';

import {
  AGENT_STATUS_WORD,
  AGENT_STATUS_WORDS,
  AgentTile,
  CostFigure,
  StatusDot,
} from './agent-parts';
import { Panel } from './panel';

/** A page lets this many dots pulse at once. Past it, a running agent is told by its colour and its word. */
const MAX_PULSING = 3;

function pulsingIdsOf(agents: RunAgent[]) {
  const running = agents.filter((agent) => agent.status === 'running');
  const pulsing = running.slice(0, MAX_PULSING);
  const ids = pulsing.map((agent) => agent.id);
  return new Set(ids);
}

function rowToneOf(isPicked: boolean) {
  if (isPicked) {
    return 'bg-foreground/[0.07]';
  }
  return 'hover:bg-foreground/[0.04]';
}

function dimOf(isDimmed: boolean) {
  if (isDimmed) {
    return 'opacity-40';
  }
  return undefined;
}

function AgentClock({ agent }: { agent: RunAgent }) {
  if (agent.status === 'running') {
    return <LiveDuration item={agent} isRunning className='w-10 text-end' />;
  }
  if (agent.status === 'done') {
    const elapsed = elapsedOf(agent, agent.endedAt ?? 0);
    return (
      <span className='w-10 text-end tabular-nums'>
        {formatDuration(elapsed)}
      </span>
    );
  }
  return <span className='w-10' />;
}

type FleetRowProps = {
  agent: RunAgent;
  isPicked: boolean;
  isDimmed: boolean;
  isPulsing: boolean;
  isPressed: boolean;
  onPick: (id: string) => void;
};

function FleetRow({
  agent,
  isPicked,
  isDimmed,
  isPulsing,
  isPressed,
  onPick,
}: FleetRowProps) {
  const task = agent.task ?? 'Not started';

  function pick() {
    onPick(agent.id);
  }

  return (
    <li>
      <button
        type='button'
        aria-pressed={isPicked}
        onClick={pick}
        className={cn(
          'focus-visible:ring-ring/25 flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-start transition-[background-color,opacity,scale] duration-150 outline-none focus-visible:ring-[3px]',
          rowToneOf(isPicked),
          dimOf(isDimmed),
          pressedQuietOf(isPressed)
        )}
      >
        <AgentTile agent={agent} />
        <span className='flex min-w-0 flex-1 flex-col leading-tight'>
          <span className='flex min-w-0 items-baseline gap-1.5 text-[13px]'>
            <span className='truncate font-medium'>{agent.name}</span>
            <span className='text-muted-foreground hidden truncate text-xs @md:inline'>
              {agent.role}
            </span>
          </span>
          <span
            key={task}
            className='text-muted-foreground truncate text-xs transition-opacity duration-300 starting:opacity-0'
          >
            {task}
          </span>
        </span>
        <span className='flex shrink-0 flex-col items-end gap-0.5 text-xs'>
          <span className='flex items-center gap-1.5'>
            <StatusDot status={agent.status} isPulsing={isPulsing} />
            <WordRoll
              text={AGENT_STATUS_WORD[agent.status]}
              labels={AGENT_STATUS_WORDS}
            />
          </span>
          <span className='text-muted-foreground flex items-center gap-1.5 tabular-nums'>
            <AgentClock agent={agent} />
            <CostFigure usd={agent.costUsd ?? 0} />
          </span>
        </span>
      </button>
    </li>
  );
}

type FleetProps = {
  run: RunSnapshot;
  focusAgentId: string | null;
  pressed: string | null;
  onFocusAgent: (id: string) => void;
  className?: string;
};

export function Fleet({
  run,
  focusAgentId,
  pressed,
  onFocusAgent,
  className,
}: FleetProps) {
  const pulsing = pulsingIdsOf(run.agents);
  const hasFocus = focusAgentId !== null;
  const working = run.agents.filter((agent) => agent.status === 'running');

  return (
    <Panel
      panel='fleet'
      title='Fleet'
      className={cn('@container', className)}
      meta={
        <span className='text-muted-foreground text-xs tabular-nums'>
          {countOf(run.agents.length, 'agent')}, {working.length} at work
        </span>
      }
    >
      <ul aria-label='Agents of this run' className='-mx-2 flex flex-col'>
        {run.agents.map((agent) => (
          <FleetRow
            key={agent.id}
            agent={agent}
            isPicked={focusAgentId === agent.id}
            isDimmed={hasFocus && focusAgentId !== agent.id}
            isPulsing={pulsing.has(agent.id)}
            isPressed={pressed === `fleet-${agent.id}`}
            onPick={onFocusAgent}
          />
        ))}
      </ul>
    </Panel>
  );
}
