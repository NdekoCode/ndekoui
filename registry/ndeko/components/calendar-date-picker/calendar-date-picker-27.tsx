'use client';

import { format } from 'date-fns';
import { useId, useState } from 'react';

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

function dateLabelOf(date: Date | undefined) {
  if (!date) {
    return 'Pick a date';
  }
  return format(date, 'PPP');
}

export default function CalendarDatePicker27() {
  const id = useId();
  const [date, setDate] = useState<Date | undefined>();
  const isEmpty = !date;

  return (
    <div className='flex w-full max-w-xs flex-col gap-1.5'>
      <Label htmlFor={id}>Date picker</Label>
      <Popover>
        <PopoverTrigger id={id} className={TRIGGER}>
          <SwapText
            text={dateLabelOf(date)}
            className={cn(isEmpty && 'text-muted-foreground/75')}
          />
          <CalendarIcon className='text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors' />
        </PopoverTrigger>
        <PopoverContent className='w-auto p-2' align='start'>
          <AnimatedCalendar mode='single' selected={date} onSelect={setDate} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
