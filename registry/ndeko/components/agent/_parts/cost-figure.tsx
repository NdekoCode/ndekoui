'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';

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

/** Matches `formatCost`: three decimals under a dollar, two above. */
export function costFormatOf(usd: number) {
  if (usd < 1) {
    return SMALL_COST;
  }
  return LARGE_COST;
}

type CostFigureProps = {
  usd: number;
  className?: string;
};

export function CostFigure({ usd, className }: CostFigureProps) {
  const format = costFormatOf(usd);

  return (
    <MotionNumber
      value={usd}
      format={format}
      className={cn('tabular-nums', className)}
    />
  );
}
