'use client';

import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';

import type { Figure, Reading } from './figures-data';

const DETAIL =
  'text-muted-foreground transition-opacity duration-150 group-hover/figure:opacity-0 group-focus-visible/figure:opacity-0 group-data-[lit=true]/figure:opacity-0';

const CONTEXT =
  'text-foreground opacity-0 transition-opacity duration-150 group-hover/figure:opacity-100 group-focus-visible/figure:opacity-100 group-data-[lit=true]/figure:opacity-100';

function formatOf(fractionDigits: number): Intl.NumberFormatOptions {
  return {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  };
}

type FigureCellProps = {
  figure: Figure;
  reading: Reading;
  /** The demonstration shows the comparison as a hover would. */
  isLit: boolean;
  className?: string;
  children: React.ReactNode;
};

export function FigureCell({
  figure,
  reading,
  isLit,
  className,
  children,
}: FigureCellProps) {
  const labelId = useId();
  const valueId = useId();
  const contextId = useId();
  const nameIds = `${labelId} ${valueId}`;
  const format = formatOf(figure.fractionDigits);

  return (
    <div
      role='group'
      tabIndex={0}
      aria-labelledby={nameIds}
      aria-describedby={contextId}
      data-lit={isLit}
      className={cn(
        'group/figure bg-foreground/[0.03] hover:bg-foreground/[0.05] focus-visible:ring-ring/25 data-[lit=true]:bg-foreground/[0.05] flex min-w-0 flex-col justify-between gap-8 rounded-2xl p-5 transition-colors duration-150 outline-none focus-visible:ring-[3px] @2xl:p-6',
        className
      )}
    >
      <div className='flex flex-col gap-2'>
        <p
          id={labelId}
          className='text-muted-foreground text-[13px] font-medium'
        >
          {figure.label}
        </p>
        <span id={valueId} className='flex'>
          <MotionNumber
            value={reading.value}
            format={format}
            suffix={figure.suffix}
            className='text-4xl font-semibold @5xl:text-5xl'
          />
        </span>
        <div className='grid text-[13px] leading-5 *:col-start-1 *:row-start-1'>
          <p className={DETAIL}>{figure.detail}</p>
          <p id={contextId} className={CONTEXT}>
            {reading.context}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
