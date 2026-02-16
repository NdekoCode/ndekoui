'use client';

import { addDays } from 'date-fns';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { AnimatedCalendar } from './_parts/animated-calendar';

const ROUND_ENDS_WITH_BAND = {
  day: [
    'relative before:absolute before:inset-x-0 before:inset-y-px',
    'before:from-transparent before:from-50% before:to-primary/[0.08] before:to-50%',
    '[&.range-start:not(.range-end)]:before:bg-linear-to-r [&.range-end:not(.range-start)]:before:bg-linear-to-l',
  ].join(' '),
  day_button:
    'rounded-full group-[.range-start:not(.range-end)]:rounded-e-full group-[.range-end:not(.range-start)]:rounded-s-full',
};

function threeDaysFromToday(): DateRange {
  const today = new Date();
  return { from: today, to: addDays(today, 3) };
}

export default function CalendarDatePicker09() {
  const [range, setRange] = useState<DateRange | undefined>(threeDaysFromToday);

  return (
    <AnimatedCalendar
      mode='range'
      selected={range}
      onSelect={setRange}
      className='bg-card hairline-ring ring-border rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      classNames={ROUND_ENDS_WITH_BAND}
    />
  );
}
