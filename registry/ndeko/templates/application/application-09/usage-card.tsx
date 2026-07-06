'use client';

import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import {
  AGENTS,
  AGENT_ORDER,
  BUDGET_LABEL,
  BUDGET_USD,
  type AgentId,
} from './data';
import { totalSpendOf } from './session';

const CENTS: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

const VIEW = 36;

const CENTRE = VIEW / 2;

const RADIUS = 15;

const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function shareOf(amount: number) {
  return Math.min(1, amount / BUDGET_USD);
}

function emptyLengthOf(share: number) {
  return CIRCUMFERENCE * (1 - share);
}

/** The ring eases to its new length once per run, which is the only time it is painted again. */
function UsageRing({ share }: { share: number }) {
  const percent = Math.round(share * 100);

  return (
    <span className='relative inline-flex size-24 shrink-0 items-center justify-center'>
      <svg
        aria-hidden='true'
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className='absolute inset-0 size-full -rotate-90'
      >
        <circle
          cx={CENTRE}
          cy={CENTRE}
          r={RADIUS}
          fill='none'
          strokeWidth={3}
          className='stroke-foreground/10'
        />
        <circle
          cx={CENTRE}
          cy={CENTRE}
          r={RADIUS}
          fill='none'
          strokeWidth={3}
          strokeLinecap='round'
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={emptyLengthOf(share)}
          className='stroke-primary transition-[stroke-dashoffset] duration-500 ease-(--ease-out-strong)'
        />
      </svg>
      <span className='flex items-baseline text-xl font-semibold'>
        <MotionNumber value={percent} />
        <span className='text-muted-foreground text-xs font-normal'>%</span>
      </span>
    </span>
  );
}

function AgentSpend({ agentId, amount }: { agentId: AgentId; amount: number }) {
  const agent = AGENTS[agentId];
  const color = seriesColorOf(agent.series);
  const share = shareOf(amount);

  return (
    <li className='flex flex-col gap-1.5'>
      <div className='flex items-center gap-2'>
        <MeshTile seed={agent.name} color={color} size='sm' />
        <span className='min-w-0 flex-1 truncate text-[13px]'>
          {agent.name}
        </span>
        <MotionNumber value={amount} format={CENTS} className='text-xs' />
      </div>
      <span className='bg-foreground/[0.06] block h-1 overflow-hidden rounded-full'>
        <span
          style={{ backgroundColor: color, transform: `scaleX(${share})` }}
          className='block h-full origin-left rounded-full transition-transform duration-500 ease-(--ease-out-strong)'
        />
      </span>
    </li>
  );
}

type UsageCardProps = {
  spend: Record<AgentId, number>;
};

export function UsageCard({ spend }: UsageCardProps) {
  const titleId = useId();
  const total = totalSpendOf(spend);
  const share = shareOf(total);

  return (
    <section
      aria-labelledby={titleId}
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col gap-5 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <h2 id={titleId} className='text-sm font-medium'>
        Usage this month
      </h2>
      <div className='flex items-center gap-4'>
        <UsageRing share={share} />
        <div className='flex min-w-0 flex-col gap-0.5'>
          <span className='text-muted-foreground text-xs'>Spent so far</span>
          <MotionNumber
            value={total}
            format={CENTS}
            className='text-xl font-semibold'
          />
          <span className='text-muted-foreground text-xs'>
            of {BUDGET_LABEL} budget
          </span>
        </div>
      </div>
      <ul aria-label='Spend by agent' className='flex flex-col gap-3.5'>
        {AGENT_ORDER.map((agentId) => (
          <AgentSpend key={agentId} agentId={agentId} amount={spend[agentId]} />
        ))}
      </ul>
    </section>
  );
}
