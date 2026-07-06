'use client';

import { WordRoll } from '@/components/core/word-roll';
import { MenuIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Segments } from '@/registry/ndeko/ui/segments';

import { PERIODS, type PeriodId } from './data';
import { dataOf } from './period-data';

const RANGE_LABELS = PERIODS.map((period) => dataOf(period.value).rangeLabel);

type PageHeaderProps = {
  period: PeriodId;
  canReplay: boolean;
  onPeriodChange: (period: PeriodId) => void;
  onReplay: () => void;
  onOpenMenu: () => void;
};

export function PageHeader({
  period,
  canReplay,
  onPeriodChange,
  onReplay,
  onOpenMenu,
}: PageHeaderProps) {
  const { rangeLabel } = dataOf(period);

  return (
    <header className='flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2'>
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          data-menu-open
          aria-label='Open the sections'
          aria-haspopup='dialog'
          onClick={onOpenMenu}
          className='text-muted-foreground @3xl:hidden'
        >
          <MenuIcon />
        </Button>
        <div className='flex min-w-0 flex-col ps-1 leading-tight'>
          <h1 className='text-sm font-medium'>Marketing</h1>
          <p className='text-muted-foreground text-xs'>
            <WordRoll text={rangeLabel} labels={RANGE_LABELS} />
          </p>
        </div>
        <Badge variant='secondary'>Illustrative data</Badge>
      </div>
      <div className='flex items-center gap-2'>
        <ReplayButton isShown={canReplay} onReplay={onReplay} label='Replay' />
        <Segments
          value={period}
          segments={PERIODS}
          onValueChange={onPeriodChange}
          label='Period'
        />
      </div>
    </header>
  );
}
