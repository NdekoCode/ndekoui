'use client';

import { addDays } from 'date-fns';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { AnimatedCalendar } from './_parts/animated-calendar';

function threeDaysFromToday(): DateRange {
  const today = new Date();
  return { from: today, to: addDays(today, 3) };
}

export default function CalendarDatePicker05() {
  const [range, setRange] = useState<DateRange | undefined>(threeDaysFromToday);

  return (
    <AnimatedCalendar
      mode='range'
      selected={range}
      onSelect={setRange}
      className='bg-card hairline-ring ring-border rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    />
  );
}
