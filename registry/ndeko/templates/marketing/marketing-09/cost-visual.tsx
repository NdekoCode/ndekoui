'use client';

import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';

import { COST, ILLUSTRATIVE_NOTE } from './data';
import { useSteps } from './use-steps';
import { type VisualProps } from './visual-props';

const WEEK_CELLS = Array.from({ length: COST.weeks }, (_, index) => index);

function cellToneOf(isCounted: boolean) {
  if (isCounted) {
    return 'bg-primary';
  }
  return 'bg-foreground/[0.08]';
}

type FigureProps = {
  value: number;
  label: string;
};

function Figure({ value, label }: FigureProps) {
  return (
    <div className='flex flex-col gap-1'>
      <p className='min-w-[3ch] text-5xl font-semibold tabular-nums'>{value}</p>
      <p className='text-muted-foreground text-xs'>{label}</p>
    </div>
  );
}

export function CostVisual({ progress }: VisualProps) {
  const weeks = useSteps(progress, COST.weeks, 0.9);
  const hours = Math.round(weeks * COST.hoursPerWeek);
  const days = Math.floor(hours / COST.hoursPerDay);

  return (
    <div className='bg-card hairline-ring ring-border mx-auto flex w-full max-w-md flex-col gap-6 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.12)] sm:p-6'>
      <div className='flex flex-wrap items-start justify-between gap-x-4 gap-y-3'>
        <div className='flex gap-8'>
          <Figure value={hours} label={COST.hoursLabel} />
          <Figure value={days} label={COST.daysLabel} />
        </div>
        <Badge variant='secondary' className='text-muted-foreground'>
          {ILLUSTRATIVE_NOTE}
        </Badge>
      </div>
      <ol
        aria-label='The 52 weeks of the year, counted one by one'
        className='grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1.5'
      >
        {WEEK_CELLS.map((cell) => (
          <li
            key={cell}
            className={cn(
              'aspect-square rounded-[3px] transition-colors duration-200 ease-(--ease-out-strong)',
              cellToneOf(cell < weeks)
            )}
          />
        ))}
      </ol>
      <p className='text-muted-foreground text-xs'>{COST.perWeekLabel}</p>
    </div>
  );
}
