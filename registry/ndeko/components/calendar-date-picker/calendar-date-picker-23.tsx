'use client';

import { addDays } from 'date-fns';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { AnimatedCalendar } from './_parts/animated-calendar';

const THREE_MONTHS = {
  months: 'flex-row flex-wrap justify-center gap-x-8 gap-y-4',
  month: [
    'relative before:absolute before:bg-border first-of-type:before:hidden',
    'max-md:before:inset-x-2 max-md:before:-top-4 max-md:before:h-(--hairline)',
    'md:before:inset-y-2 md:before:-left-4 md:before:w-(--hairline)',
  ].join(' '),
};

function nextFortyEightDays(): DateRange {
  const today = new Date();
  return { from: today, to: addDays(today, 48) };
}

export default function CalendarDatePicker23() {
  const [range, setRange] = useState<DateRange | undefined>(nextFortyEightDays);

  return (
    <AnimatedCalendar
      mode='range'
      selected={range}
      onSelect={setRange}
      numberOfMonths={3}
      pagedNavigation
      showOutsideDays={false}
      className='bg-card hairline-ring ring-border rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      classNames={THREE_MONTHS}
    />
  );
}
