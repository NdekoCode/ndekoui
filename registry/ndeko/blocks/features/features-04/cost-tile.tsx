'use client';

import { MotionNumber } from '@/components/core/motion-number';

import { BUDGET_USD, TILES } from './data';
import { Tile } from './tile';

const MONEY = { minimumFractionDigits: 3, maximumFractionDigits: 3 };

type CostTileProps = {
  cost: number;
};

export function CostTile({ cost }: CostTileProps) {
  const share = Math.min(cost / BUDGET_USD, 1);
  const barStyle = { transform: `scaleX(${share})` };
  const budget = BUDGET_USD.toFixed(2);

  return (
    <Tile copy={TILES.cost} stageClassName='gap-4'>
      <div className='flex flex-col gap-1'>
        <span className='text-muted-foreground text-xs'>Spent this run</span>
        <MotionNumber
          value={cost}
          prefix='$'
          format={MONEY}
          className='text-4xl font-semibold'
        />
      </div>
      <div className='flex flex-col gap-1.5'>
        <div
          role='progressbar'
          aria-label='Share of the budget spent'
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(share * 100)}
          className='bg-foreground/10 h-1.5 overflow-hidden rounded-full'
        >
          <div
            style={barStyle}
            className='bg-primary h-full w-full origin-left rounded-full transition-transform duration-500 ease-(--ease-out-strong) motion-reduce:transition-none'
          />
        </div>
        <span className='text-muted-foreground text-xs tabular-nums'>
          Budget ${budget}
        </span>
      </div>
    </Tile>
  );
}
