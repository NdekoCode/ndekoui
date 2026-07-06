'use client';

import type { CSSProperties } from 'react';

import {
  formatCost,
  seriesColorOf,
  type RunAgent,
  type RunSnapshot,
} from '@/registry/ndeko/lib/agent-run';
import { TriangleAlertIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Fold } from '@/registry/ndeko/ui/chat-motion';

import { AgentTile, CostFigure } from './agent-parts';
import { ALERT_SHARE, BUDGET_USD } from './data';
import { Panel } from './panel';

const PERCENT = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 0,
});

function shareOf(usd: number) {
  return Math.min(1, usd / BUDGET_USD);
}

type Slice = {
  agent: RunAgent;
  start: number;
  share: number;
};

function slicesOf(agents: RunAgent[]): Slice[] {
  const slices: Slice[] = [];
  let start = 0;
  for (const agent of agents) {
    const share = shareOf(agent.costUsd ?? 0);
    slices.push({ agent, start, share });
    start += share;
  }
  return slices;
}

function sliceStyleOf(slice: Slice): CSSProperties {
  const offset = slice.start * 100;
  return {
    backgroundColor: seriesColorOf(slice.agent.series),
    transform: `translateX(${offset}%) scaleX(${slice.share})`,
  };
}

function dimOf(isDimmed: boolean) {
  if (isDimmed) {
    return 'opacity-40';
  }
  return undefined;
}

type BudgetProps = {
  run: RunSnapshot;
  focusAgentId: string | null;
  className?: string;
};

export function Budget({ run, focusAgentId, className }: BudgetProps) {
  const total = run.usage.costUsd;
  const slices = slicesOf(run.agents);
  const share = shareOf(total);
  const isOver = share >= ALERT_SHARE;
  const left = Math.max(0, BUDGET_USD - total);
  const hasFocus = focusAgentId !== null;

  return (
    <Panel
      panel='budget'
      title='Budget'
      className={className}
      meta={<Badge variant='secondary'>Illustrative</Badge>}
    >
      <div className='flex items-baseline gap-2'>
        <CostFigure usd={total} className='text-2xl leading-8 font-semibold' />
        <span className='text-muted-foreground text-xs tabular-nums'>
          of {formatCost(BUDGET_USD)}
        </span>
      </div>
      <div className='flex flex-col gap-1.5'>
        <div
          role='img'
          aria-label={`${PERCENT.format(share)} of the budget spent`}
          className='bg-foreground/10 relative h-2 overflow-hidden rounded-full [direction:ltr]'
        >
          {slices.map((slice) => (
            <span
              key={slice.agent.id}
              style={sliceStyleOf(slice)}
              className='absolute inset-0 origin-left transition-transform duration-500 ease-(--ease-out-strong)'
            />
          ))}
          <span
            aria-hidden='true'
            style={{ left: `${ALERT_SHARE * 100}%` }}
            className='bg-foreground/40 absolute inset-y-0 w-px'
          />
        </div>
        <p className='text-muted-foreground flex justify-between text-xs tabular-nums'>
          <span>{PERCENT.format(share)} spent</span>
          <span>Alert at {PERCENT.format(ALERT_SHARE)}</span>
        </p>
      </div>
      <Fold open={isOver}>
        <p className='bg-warning/10 text-warning-foreground flex items-start gap-2 rounded-lg p-2.5 text-xs leading-5'>
          <TriangleAlertIcon className='mt-0.5 size-3.5 shrink-0' />
          Past 80% of the budget. {formatCost(left)} is left for this run.
        </p>
      </Fold>
      <ul aria-label='Spend by agent' className='flex flex-col gap-1'>
        {run.agents.map((agent) => {
          const isDimmed = hasFocus && focusAgentId !== agent.id;
          return (
            <li
              key={agent.id}
              className={cn(
                'flex h-7 items-center gap-2.5 text-[13px] transition-opacity duration-200',
                dimOf(isDimmed)
              )}
            >
              <AgentTile agent={agent} size='sm' />
              <span className='min-w-0 flex-1 truncate'>{agent.name}</span>
              <CostFigure
                usd={agent.costUsd ?? 0}
                className='text-muted-foreground text-xs'
              />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
