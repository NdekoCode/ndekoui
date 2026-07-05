'use client';

import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import {
  seriesColorOf,
  type AgentStatus,
} from '@/registry/ndeko/lib/agent-run';
import { CheckIcon, ChevronDownIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { LetterTile } from '@/registry/ndeko/ui/letter-tile';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';

import {
  MAIN_AGENTS,
  modelOf,
  subAgentsOf,
  type Agent,
  type AgentId,
  type ModelId,
} from './data';
import type { AgentLive, Decision } from './session';

const STATUS_WORD: Record<AgentStatus, string> = {
  idle: 'Stopped',
  running: 'Running',
  waiting: 'Waiting on you',
  failed: 'Failed',
  done: 'Done',
};

const STATUS_WORDS = Object.values(STATUS_WORD);

const DOT_TONE: Record<AgentStatus, string> = {
  idle: 'bg-muted-foreground/45',
  running: 'bg-info',
  waiting: 'bg-warning',
  failed: 'bg-destructive',
  done: 'bg-success',
};

const WORD_TONE: Record<AgentStatus, string> = {
  idle: 'text-muted-foreground',
  running: 'text-foreground',
  waiting: 'text-warning-foreground',
  failed: 'text-destructive-ink',
  done: 'text-muted-foreground',
};

const DECISION_WORD: Record<Decision, string> = {
  approved: 'Approved by you',
  denied: 'Denied by you',
};

const SMALL_COST: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
};

const LARGE_COST: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

/** Three decimals under a dollar, two above. */
function costFormatOf(usd: number) {
  if (usd < 1) {
    return SMALL_COST;
  }
  return LARGE_COST;
}

function isLive(status: AgentStatus) {
  const isRunning = status === 'running';
  const isWaiting = status === 'waiting';
  return isRunning || isWaiting;
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

function pressedQuietOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-foreground/[0.07] text-foreground';
  }
  return undefined;
}

function subAgentsWordOf(count: number) {
  if (count === 1) {
    return '1 sub-agent';
  }
  return `${count} sub-agents`;
}

function toggleLabelOf(agent: Agent, count: number, isOpen: boolean) {
  const subAgents = subAgentsWordOf(count);
  if (isOpen) {
    return `Hide the ${subAgents} of ${agent.name}`;
  }
  return `Show the ${subAgents} of ${agent.name}`;
}

function StatusWord({ status }: { status: AgentStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs transition-colors duration-200',
        WORD_TONE[status]
      )}
    >
      <span
        aria-hidden='true'
        className={cn(
          'size-2 shrink-0 rounded-full transition-colors duration-200',
          DOT_TONE[status]
        )}
      />
      <WordRoll text={STATUS_WORD[status]} labels={STATUS_WORDS} />
    </span>
  );
}

function ModelMark({ modelId }: { modelId: ModelId }) {
  const model = modelOf(modelId);
  const dotStyle = { backgroundColor: seriesColorOf(model.series) };

  return (
    <span className='text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs'>
      <span
        aria-hidden='true'
        style={dotStyle}
        className='size-2 shrink-0 rounded-full'
      />
      <BrandTile brand={model.brand} size='sm' />
      <span className='truncate'>{model.name}</span>
    </span>
  );
}

function DecisionTrace({ decision }: { decision: Decision }) {
  const isApproved = decision === 'approved';

  return (
    <p className='text-muted-foreground flex items-center gap-1.5 text-xs transition-opacity duration-300 starting:opacity-0'>
      {isApproved && (
        <CheckIcon className='text-success-foreground size-3.5 shrink-0' />
      )}
      {!isApproved && (
        <XIcon className='text-destructive-ink size-3.5 shrink-0' />
      )}
      {DECISION_WORD[decision]}
    </p>
  );
}

type FiguresProps = {
  live: AgentLive;
  className?: string;
};

function Figures({ live, className }: FiguresProps) {
  return (
    <div className={cn('flex shrink-0 flex-col items-end', className)}>
      <MotionNumber
        value={live.costUsd}
        format={costFormatOf(live.costUsd)}
        className='text-[13px] leading-5 font-medium'
      />
      <LiveDuration
        item={live}
        isRunning={isLive(live.status)}
        className='text-muted-foreground text-xs leading-5'
      />
    </div>
  );
}

type SubAgentRowProps = {
  agent: Agent;
  live: AgentLive;
};

function SubAgentRow({ agent, live }: SubAgentRowProps) {
  return (
    <li className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex items-start gap-2.5 rounded-lg px-2.5 py-2'>
      <LetterTile initial={agent.initials} className='mt-px' />
      <div className='flex min-w-0 flex-1 flex-col'>
        <p className='flex flex-wrap items-center gap-x-2'>
          <span className='text-[13px] leading-5 font-medium'>
            {agent.name}
          </span>
          <StatusWord status={live.status} />
        </p>
        <p className='text-muted-foreground truncate text-xs leading-5'>
          {live.task}
        </p>
      </div>
      <Figures live={live} className='w-16' />
    </li>
  );
}

type FleetRowProps = {
  agent: Agent;
  agents: Record<AgentId, AgentLive>;
  isOpen: boolean;
  isTogglePressed: boolean;
  onToggle: (id: AgentId) => void;
};

function FleetRow({
  agent,
  agents,
  isOpen,
  isTogglePressed,
  onToggle,
}: FleetRowProps) {
  const panelId = useId();
  const live = agents[agent.id];
  const subAgents = subAgentsOf(agent.id);
  const hasSubAgents = subAgents.length > 0;

  return (
    <li className='flex flex-col px-2 py-2'>
      <div className='flex items-start gap-3'>
        <LetterTile initial={agent.initials} size='lg' />
        <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <p className='flex flex-wrap items-center gap-x-2.5'>
            <span className='text-[13px] leading-5 font-medium'>
              {agent.name}
            </span>
            <StatusWord status={live.status} />
          </p>
          <p className='text-foreground/85 truncate text-xs leading-5'>
            {live.task}
          </p>
          {live.decision && <DecisionTrace decision={live.decision} />}
          <div className='pt-0.5 @2xl:hidden'>
            <ModelMark modelId={agent.model} />
          </div>
        </div>
        <div className='hidden w-36 shrink-0 pt-0.5 @2xl:block'>
          <ModelMark modelId={agent.model} />
        </div>
        <Figures live={live} className='w-16' />
        <span className='flex size-7 shrink-0 items-center justify-center'>
          {hasSubAgents && (
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-expanded={isOpen}
              aria-controls={panelId}
              aria-label={toggleLabelOf(agent, subAgents.length, isOpen)}
              onClick={() => onToggle(agent.id)}
              className={cn(
                'text-muted-foreground',
                pressedQuietOf(isTogglePressed)
              )}
            >
              <ChevronDownIcon
                className={cn(
                  'transition-transform duration-200 ease-(--ease-out-strong)',
                  chevronTurnOf(isOpen)
                )}
              />
            </Button>
          )}
        </span>
      </div>
      {hasSubAgents && (
        <Fold open={isOpen} id={panelId} className='ps-10'>
          <ul
            aria-label={`Sub-agents of ${agent.name}`}
            className='flex flex-col gap-1 pt-2'
          >
            {subAgents.map((subAgent) => (
              <SubAgentRow
                key={subAgent.id}
                agent={subAgent}
                live={agents[subAgent.id]}
              />
            ))}
          </ul>
        </Fold>
      )}
    </li>
  );
}

type FleetProps = {
  agents: Record<AgentId, AgentLive>;
  runningCount: number;
  openId: AgentId | null;
  pressed: string | null;
  onToggle: (id: AgentId) => void;
};

export function Fleet({
  agents,
  runningCount,
  openId,
  pressed,
  onToggle,
}: FleetProps) {
  const isAnyRunning = runningCount > 0;

  return (
    <section
      aria-label='Fleet'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col rounded-xl p-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex h-9 items-center gap-2 px-3'>
        <h2 className='text-sm font-medium'>Fleet</h2>
        <span className='text-muted-foreground flex items-center gap-1.5 text-xs'>
          {isAnyRunning && (
            <span
              aria-hidden='true'
              className='bg-info size-1.5 animate-pulse rounded-full'
            />
          )}
          <MotionNumber value={runningCount} />
          running
        </span>
      </header>
      <ul className='flex flex-col'>
        {MAIN_AGENTS.map((agent) => (
          <FleetRow
            key={agent.id}
            agent={agent}
            agents={agents}
            isOpen={openId === agent.id}
            isTogglePressed={pressed === `toggle-${agent.id}`}
            onToggle={onToggle}
          />
        ))}
      </ul>
    </section>
  );
}
