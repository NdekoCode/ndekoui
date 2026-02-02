'use client';

import { useState } from 'react';

import { MorphingLabel } from '@/registry/ndeko/components/navbar/_parts/morphing-label';
import { CalendarIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Calendar } from '@/registry/ndeko/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

type DateRange = { from: Date | undefined; to?: Date | undefined };

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function rangeLabelOf(range: DateRange | undefined) {
  const from = range?.from;
  if (!from) {
    return 'Date';
  }
  const to = range?.to;
  if (!to) {
    return DATE_FORMAT.format(from);
  }
  return DATE_FORMAT.formatRange(from, to);
}

function DatePicker() {
  const [range, setRange] = useState<DateRange | undefined>();
  const label = rangeLabelOf(range);

  function selectRange(nextRange: DateRange | undefined) {
    setRange(nextRange);
  }

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant='outline' className='tabular-nums' />}
      >
        <CalendarIcon className='text-muted-foreground' />
        <MorphingLabel value={label}>{label}</MorphingLabel>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-auto p-2'>
        <Calendar mode='range' selected={range} onSelect={selectRange} />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
