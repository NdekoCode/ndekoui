'use client';

import { format } from 'date-fns';
import { useId, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { CalendarIcon } from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE, CONTROL_SIZES } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Label } from '@/registry/ndeko/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

import { AnimatedCalendar } from './_parts/animated-calendar';
import { SwapText } from './_parts/swap-text';

const TRIGGER = cn(
  CONTROL_RECIPE,
  CONTROL_SIZES.default,
  'group flex cursor-pointer items-center justify-between gap-2 text-left data-popup-open:border-foreground/30'
);

const DAY_FORMAT = 'LLL dd, y';

function rangeLabelOf(range: DateRange | undefined) {
  if (!range?.from) {
    return 'Pick a date range';
  }
  const fromLabel = format(range.from, DAY_FORMAT);
  if (!range.to) {
    return fromLabel;
  }
  const toLabel = format(range.to, DAY_FORMAT);
  return `${fromLabel} - ${toLabel}`;
}

export default function CalendarDatePicker28() {
  const id = useId();
  const [range, setRange] = useState<DateRange | undefined>();
  const isEmpty = !range?.from;

  return (
    <div className='flex w-full max-w-xs flex-col gap-1.5'>
      <Label htmlFor={id}>Date range picker</Label>
      <Popover>
        <PopoverTrigger id={id} className={TRIGGER}>
          <SwapText
            text={rangeLabelOf(range)}
            className={cn(isEmpty && 'text-muted-foreground/75')}
          />
          <CalendarIcon className='text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors' />
        </PopoverTrigger>
        <PopoverContent className='w-auto p-2' align='start'>
          <AnimatedCalendar mode='range' selected={range} onSelect={setRange} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
