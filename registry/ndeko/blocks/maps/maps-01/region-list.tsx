'use client';

import { memo } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';

import { REGIONS, type Region, type RegionId, type RegionLoad } from './data';

/** A row is 48px tall with 2px below it: the highlight travels this far a row, on transform alone. */
const ROW_PITCH_PX = 50;

const ROW = [
  'flex h-12 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-start outline-none',
  'transition-[background-color,scale] duration-150 ease-(--ease-out-strong) active:scale-[0.98]',
  'hover:bg-foreground/[0.03] focus-visible:ring-ring/25 focus-visible:ring-[3px]',
].join(' ');

const HIGHLIGHT =
  'bg-foreground/[0.06] pointer-events-none absolute inset-x-0 top-0 h-12 rounded-lg transition-transform duration-200 ease-(--ease-out-strong)';

const FIGURE = 'shrink-0 justify-end text-[13px]';

const SPEND: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

const SPEND_TEXT = new Intl.NumberFormat('en-US', SPEND);

function runsWordOf(count: number) {
  if (count === 1) {
    return '1 run';
  }
  return `${count} runs`;
}

function liveWordOf(count: number) {
  if (count === 1) {
    return 'run live';
  }
  return 'runs live';
}

function regionsWordOf(count: number) {
  if (count === 1) {
    return '1 region';
  }
  return `${count} regions`;
}

function totalLineOf(total: number) {
  const live = liveWordOf(total);
  const regions = regionsWordOf(REGIONS.length);
  return `${live} in ${regions}`;
}

function dollarsOf(cents: number) {
  return cents / 100;
}

/** Europe, Frankfurt: 11 runs, 140k tokens a minute, $7.10 an hour. */
function spokenOf(region: Region, load: RegionLoad) {
  const runs = runsWordOf(load.runs);
  const dollars = dollarsOf(load.cents);
  const spend = SPEND_TEXT.format(dollars);
  const place = `${region.name}, ${region.place}`;
  return `${place}: ${runs}, ${load.tokens}k tokens a minute, ${spend} an hour`;
}

function dotOf(isPicked: boolean) {
  if (isPicked) {
    return 'bg-primary';
  }
  return 'bg-foreground/25';
}

function highlightStyleOf(selectedId: RegionId) {
  const index = REGIONS.findIndex((region) => region.id === selectedId);
  const row = Math.max(index, 0);
  const offset = row * ROW_PITCH_PX;
  return { transform: `translateY(${offset}px)` };
}

type RegionRowProps = {
  region: Region;
  load: RegionLoad;
  isPicked: boolean;
  isPressed: boolean;
  onSelect: (id: RegionId) => void;
};

/** A row renders again only when its own figures, its pick or its press change. */
const RegionRow = memo(function RegionRow({
  region,
  load,
  isPicked,
  isPressed,
  onSelect,
}: RegionRowProps) {
  const spend = dollarsOf(load.cents);

  return (
    <li>
      <button
        type='button'
        aria-pressed={isPicked}
        aria-label={spokenOf(region, load)}
        onClick={() => onSelect(region.id)}
        className={cn(ROW, pressedQuietOf(isPressed))}
      >
        <span
          aria-hidden='true'
          className={cn(
            'size-2 shrink-0 rounded-full transition-colors duration-150',
            dotOf(isPicked)
          )}
        />
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='truncate text-[13px] leading-5 font-medium'>
            {region.name}
          </span>
          <span className='text-muted-foreground truncate text-xs leading-4'>
            {region.place}
          </span>
        </span>
        <MotionNumber value={load.runs} className={cn(FIGURE, 'w-9')} />
        <MotionNumber
          value={load.tokens}
          suffix='k'
          className={cn(FIGURE, 'w-12')}
        />
        <MotionNumber
          value={spend}
          format={SPEND}
          className={cn(FIGURE, 'w-14')}
        />
      </button>
    </li>
  );
});

const TotalLine = memo(function TotalLine({ total }: { total: number }) {
  return (
    <p className='flex flex-wrap items-baseline gap-x-2 px-2.5 pt-1.5 pb-3'>
      <MotionNumber
        value={total}
        className='text-2xl leading-8 font-semibold'
      />
      <span className='text-muted-foreground text-xs'>
        {totalLineOf(total)}
      </span>
    </p>
  );
});

export type RegionListProps = {
  loads: Record<RegionId, RegionLoad>;
  selectedId: RegionId;
  total: number;
  /** The region a demonstration picks, shown held down. */
  pressed: string | null;
  onSelect: (id: RegionId) => void;
};

/** One row per region: picking one turns the globe to it, and its figures roll as runs come and go. */
export function RegionList({
  loads,
  selectedId,
  total,
  pressed,
  onSelect,
}: RegionListProps) {
  return (
    <section
      aria-label='Regions'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex min-w-0 flex-col rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <TotalLine total={total} />
      <div
        aria-hidden='true'
        className='text-muted-foreground flex items-center gap-2.5 px-2.5 pb-1 text-xs'
      >
        <span className='size-2 shrink-0' />
        <span className='min-w-0 flex-1'>Region</span>
        <span className='w-9 shrink-0 text-end'>Runs</span>
        <span className='w-12 shrink-0 text-end'>Tokens</span>
        <span className='w-14 shrink-0 text-end'>Spend</span>
      </div>
      <div className='relative'>
        <span
          aria-hidden='true'
          style={highlightStyleOf(selectedId)}
          className={HIGHLIGHT}
        />
        <ul className='relative flex flex-col gap-0.5'>
          {REGIONS.map((region) => (
            <RegionRow
              key={region.id}
              region={region}
              load={loads[region.id]}
              isPicked={region.id === selectedId}
              isPressed={pressed === `region-${region.id}`}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </div>
      <p className='text-muted-foreground px-2.5 pt-2 pb-1 text-xs'>
        Tokens a minute and spend an hour, as they stand now
      </p>
    </section>
  );
}
