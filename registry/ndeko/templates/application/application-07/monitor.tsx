'use client';

import { useId, useState, type CSSProperties } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import {
  elapsedOf,
  formatDuration,
  type PlanStep,
  type RunAgent,
  type RunSnapshot,
} from '@/registry/ndeko/lib/agent-run';
import { hatchOf } from '@/registry/ndeko/lib/hatch';
import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { Wash } from '@/registry/ndeko/ui/wash';

import {
  AGENT_STATUS_WORD,
  AGENT_STATUS_WORDS,
  AgentTile,
  CostFigure,
  StatusDot,
} from './agent-parts';
import { ApprovalBlock } from './approval-block';
import { planSeedOf } from './data';
import { agentOf, monitoredAgentOf } from './model';
import { Panel } from './panel';
import type { Decision } from './session';

const WASH_HUE: Record<string, string> = {
  running: 'var(--info)',
  waiting: 'var(--warning)',
  done: 'var(--success)',
};

function washHueOf(status: string) {
  return WASH_HUE[status] ?? 'var(--info)';
}

function isWashShown(status: string) {
  return WASH_HUE[status] !== undefined;
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

function stepOfAgent(run: RunSnapshot, agent: RunAgent) {
  const owned = run.plan.filter(
    (step) => planSeedOf(step.id).ownerId === agent.id
  );
  const live = owned.find((step) => step.status === 'running');
  return live ?? owned[0];
}

function stepLineOf(run: RunSnapshot, step: PlanStep | undefined) {
  if (!step) {
    return 'No step of the plan is its own';
  }
  const position = run.plan.findIndex((candidate) => candidate.id === step.id);
  return `Step ${position + 1} of ${run.plan.length}: ${step.title}`;
}

function AgentClock({ agent }: { agent: RunAgent }) {
  if (agent.status === 'running') {
    return (
      <LiveDuration
        item={agent}
        isRunning
        className='text-muted-foreground text-xs'
      />
    );
  }
  if (agent.status === 'done') {
    const elapsed = elapsedOf(agent, agent.endedAt ?? 0);
    return (
      <span className='text-muted-foreground text-xs tabular-nums'>
        {formatDuration(elapsed)}
      </span>
    );
  }
  return null;
}

type Fill = {
  key: string;
  className: string;
  style?: CSSProperties;
};

const FILL_TONE: Record<string, string> = {
  running: 'bg-primary/70',
  done: 'bg-primary',
};

/** A running segment fills over the time its step usually takes, in one transition on the compositor. */
function fillOf(
  step: PlanStep,
  isWaiting: boolean,
  expectedMs: number
): Fill | null {
  if (step.status === 'upcoming') {
    return null;
  }
  if (isWaiting) {
    const style = { backgroundImage: hatchOf('var(--warning)') };
    return { key: 'waiting', className: 'bg-warning/10', style };
  }
  if (step.status === 'skipped') {
    return { key: 'skipped', className: 'bg-foreground/15' };
  }
  const style = { transitionDuration: `${expectedMs}ms` };
  const tone = FILL_TONE[step.status];
  const className = cn(
    'origin-left scale-x-100 transition-[scale,background-color] ease-linear starting:scale-x-0',
    tone
  );
  return { key: 'fill', className, style };
}

type SegmentProps = {
  step: PlanStep;
  isWaiting: boolean;
};

function Segment({ step, isWaiting }: SegmentProps) {
  const seed = planSeedOf(step.id);
  const fill = fillOf(step, isWaiting, seed.expectedMs);

  return (
    <li className='bg-foreground/10 relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full'>
      {fill && (
        <span
          key={fill.key}
          style={fill.style}
          className={cn('absolute inset-0', fill.className)}
        />
      )}
      <span className='sr-only'>
        {seed.title}, {step.status}
      </span>
    </li>
  );
}

function TimeStrip({ run }: { run: RunSnapshot }) {
  const isEmpty = run.plan.length === 0;

  return (
    <div className='flex flex-col gap-1.5'>
      <ol aria-label='Steps of the plan' className='flex gap-1'>
        {run.plan.map((step) => {
          const ownerId = planSeedOf(step.id).ownerId;
          const owner = agentOf(run, ownerId);
          const isOwnerWaiting = owner?.status === 'waiting';
          const isWaiting = isOwnerWaiting && step.status === 'running';
          return <Segment key={step.id} step={step} isWaiting={isWaiting} />;
        })}
        {isEmpty && (
          <li className='bg-foreground/10 h-1.5 flex-1 rounded-full'>
            <span className='sr-only'>No plan yet</span>
          </li>
        )}
      </ol>
    </div>
  );
}

type MonitorBodyProps = {
  run: RunSnapshot;
  agent: RunAgent | undefined;
};

function MonitorBody({ run, agent }: MonitorBodyProps) {
  if (!agent) {
    return null;
  }
  const step = stepOfAgent(run, agent);
  const hasTask = agent.task !== undefined;
  const task = agent.task ?? 'Waiting for its turn';

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-2.5'>
        <AgentTile agent={agent} />
        <div className='flex min-w-0 flex-1 flex-col leading-tight'>
          <span className='truncate text-[13px] font-medium'>{agent.name}</span>
          <span className='text-muted-foreground truncate text-xs'>
            {agent.model}
          </span>
        </div>
        <span className='flex shrink-0 items-center gap-1.5 text-xs'>
          <StatusDot status={agent.status} />
          <WordRoll
            text={AGENT_STATUS_WORD[agent.status]}
            labels={AGENT_STATUS_WORDS}
          />
        </span>
      </div>
      <div className='bg-foreground/[0.04] flex flex-col gap-1.5 rounded-lg p-3'>
        <p
          key={task}
          className='min-h-5 text-[13px] leading-5 font-medium transition-opacity duration-300 starting:opacity-0'
        >
          {task}
        </p>
        <div className='text-muted-foreground flex items-center justify-between gap-3 text-xs'>
          <span className='min-w-0 truncate'>
            {hasTask && stepLineOf(run, step)}
            {!hasTask && 'Nothing assigned yet'}
          </span>
          <span className='w-10 shrink-0 text-end'>
            <AgentClock agent={agent} />
          </span>
        </div>
      </div>
      <TimeStrip run={run} />
      <div className='flex items-end justify-between gap-3'>
        <div className='flex min-w-0 flex-col gap-0.5'>
          <span className='text-muted-foreground text-xs'>
            Spent by {agent.name}
          </span>
          <CostFigure
            usd={agent.costUsd ?? 0}
            className='text-2xl leading-8 font-semibold'
          />
        </div>
      </div>
    </div>
  );
}

type MonitorProps = {
  run: RunSnapshot;
  focusAgentId: string | null;
  pressed: string | null;
  onDecide: (decision: Decision) => void;
  className?: string;
};

export function Monitor({
  run,
  focusAgentId,
  pressed,
  onDecide,
  className,
}: MonitorProps) {
  const [isFolded, setIsFolded] = useState(false);
  const bodyId = useId();
  const agent = monitoredAgentOf(run, focusAgentId);
  const hue = washHueOf(run.status);
  const isShown = isWashShown(run.status);

  function toggle() {
    setIsFolded((current) => !current);
  }

  return (
    <Panel
      panel='monitor'
      title='Monitor'
      className={className}
      wash={<Wash color={hue} isShown={isShown} />}
      meta={
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-expanded={!isFolded}
          aria-controls={bodyId}
          aria-label='Fold the monitor'
          onClick={toggle}
          className='text-muted-foreground -me-1'
        >
          <ChevronDownIcon
            className={cn(
              'transition-transform duration-200 ease-(--ease-out-strong)',
              chevronTurnOf(!isFolded)
            )}
          />
        </Button>
      }
    >
      <Fold open={!isFolded} id={bodyId}>
        <MonitorBody run={run} agent={agent} />
      </Fold>
      <ApprovalBlock run={run} pressed={pressed} onDecide={onDecide} />
    </Panel>
  );
}
