'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { FILTERS, type TypeFilter } from './data';
import { countOfKind } from './groups';

const THUMB =
  'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] dark:ring-foreground/15';

function filterOf(value: unknown) {
  const filter = FILTERS.find((candidate) => candidate.id === value);
  return filter?.id;
}

type TypeFiltersProps = {
  filter: TypeFilter;
  pressed: string | null;
  onPick: (filter: TypeFilter) => void;
};

export function TypeFilters({ filter, pressed, onPick }: TypeFiltersProps) {
  const pressedValues = [filter];

  function changeFilter(nextValues: unknown[]) {
    const [next] = nextValues;
    const picked = filterOf(next);
    if (picked) {
      onPick(picked);
    }
  }

  return (
    <div className='relative -mx-4 overflow-x-auto px-4 @2xl:mx-0 @2xl:px-0'>
      <ToggleGroup
        aria-label='Kind of change'
        value={pressedValues}
        onValueChange={changeFilter}
        travel
        size='sm'
        indicatorClassName={THUMB}
        className='bg-foreground/[0.05] rounded-lg p-0.5'
      >
        {FILTERS.map((item) => (
          <ToggleGroupItem
            key={item.id}
            value={item.id}
            className={cn(
              'h-7 gap-1.5 rounded-md px-2.5 text-xs',
              pressedQuietOf(pressed === `filter-${item.id}`)
            )}
          >
            {item.label}
            <span className='text-muted-foreground tabular-nums'>
              {countOfKind(item.id)}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
