'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';

import { ChartCard } from './chart-card';
import { STAGES } from './data';
import { COUNT_FORMAT, percentOf } from './format';
import type { PeriodData } from './period-data';

/** The narrowest a bar gets, so the last stage stays a bar and not a line. */
const MIN_SHARE = 0.16;

const PRECISE_PERCENT: Intl.NumberFormatOptions = {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
};

/** The first three stages are the primary colour, fading as the funnel narrows. The last one is a customer won. */
const BAR_FILL = [
  'bg-primary/90',
  'bg-primary/72',
  'bg-primary/54',
  'bg-success/80',
];

/** Counts fall faster than a person can read bars, so a bar is as wide as the square root of its count. */
function widthShareOf(count: number, first: number) {
  if (first === 0) {
    return MIN_SHARE;
  }
  const share = Math.sqrt(count / first);
  return Math.max(share, MIN_SHARE);
}

function insetOf(share: number) {
  const side = ((1 - share) / 2) * 100;
  const text = `${side.toFixed(2)}%`;
  return `inset(0 ${text} 0 ${text} round 6px)`;
}

function moveOnOf(count: number, before: number) {
  if (before === 0) {
    return 0;
  }
  return percentOf(count / before);
}

type ConversionFunnelProps = {
  data: PeriodData;
};

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const first = data.funnel[0];
  const last = data.funnel[data.funnel.length - 1];
  const overall = (last / first) * 100;

  return (
    <ChartCard
      title='Conversion funnel'
      section='funnel'
      description={
        <p className='text-muted-foreground text-xs'>From lead to customer</p>
      }
    >
      <ol aria-label='Conversion funnel' className='flex flex-col gap-2'>
        {STAGES.map((stage, index) => {
          const count = data.funnel[index];
          const before = data.funnel[index - 1] ?? 0;
          const share = widthShareOf(count, first);
          const hasRate = index > 0;
          return (
            <li
              key={stage.id}
              className='grid grid-cols-[6.5rem_minmax(0,1fr)_auto] items-center gap-x-3'
            >
              <span className='text-muted-foreground truncate text-xs'>
                {stage.label}
              </span>
              <span aria-hidden='true' className='relative h-7'>
                <span
                  className={cn(
                    'absolute inset-0 transition-[clip-path] duration-500 ease-(--ease-out-strong)',
                    BAR_FILL[index]
                  )}
                  style={{ clipPath: insetOf(share) }}
                />
              </span>
              <span className='flex items-baseline justify-end gap-2'>
                <MotionNumber
                  value={count}
                  format={COUNT_FORMAT}
                  className='w-14 justify-end text-[13px] font-medium'
                />
                <span
                  className={cn(
                    'text-muted-foreground hidden w-9 justify-end text-xs @sm/card:inline-flex',
                    !hasRate && 'invisible'
                  )}
                >
                  <MotionNumber
                    value={moveOnOf(count, before)}
                    format={COUNT_FORMAT}
                    suffix='%'
                  />
                  <span className='sr-only'> of the stage before</span>
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className='text-muted-foreground flex items-baseline gap-1 text-xs'>
        <span>Overall</span>
        <MotionNumber
          value={overall}
          format={PRECISE_PERCENT}
          suffix='%'
          className='text-foreground font-medium'
        />
        <span>of leads become customers</span>
      </p>
    </ChartCard>
  );
}
