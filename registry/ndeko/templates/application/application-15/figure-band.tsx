'use client';

import {
  TrendingDownIcon,
  TrendingUpIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';

import { CountUp } from './count-up';
import { FIGURES, type Figure } from './data';

const TREND_ICON: Record<Figure['direction'], Icon> = {
  up: TrendingUpIcon,
  down: TrendingDownIcon,
};

type FigureCellProps = {
  figure: Figure;
  isLoaded: boolean;
};

function FigureCell({ figure, isLoaded }: FigureCellProps) {
  const TrendIcon = TREND_ICON[figure.direction];

  return (
    <div className='flex min-w-0 flex-col gap-1'>
      <p className='text-muted-foreground text-xs'>{figure.label}</p>
      <CountUp
        value={figure.value}
        format={figure.format}
        suffix={figure.suffix}
        isLoaded={isLoaded}
        className='text-2xl leading-8 font-semibold'
      />
      <p className='text-muted-foreground flex items-center gap-1 text-xs'>
        <TrendIcon className='size-3.5 shrink-0' />
        <span className='min-w-0'>{figure.change}</span>
      </p>
    </div>
  );
}

type FigureBandProps = {
  isLoaded: boolean;
};

export function FigureBand({ isLoaded }: FigureBandProps) {
  return (
    <section
      data-section='overview'
      aria-label='Key figures'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] grid scroll-mt-4 gap-5 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @lg/page:grid-cols-3 @lg/page:gap-6'
    >
      {FIGURES.map((figure) => (
        <FigureCell key={figure.id} figure={figure} isLoaded={isLoaded} />
      ))}
    </section>
  );
}
