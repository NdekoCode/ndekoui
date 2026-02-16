'use client';

import { useState } from 'react';
import type { WeekNumberProps } from 'react-day-picker';

import { AnimatedCalendar } from './_parts/animated-calendar';

function WeekNumber({ week, ...props }: WeekNumberProps) {
  return (
    <th {...props}>
      <span className='inline-flex size-9 items-center justify-center tabular-nums'>
        {week.weekNumber}
      </span>
    </th>
  );
}

export default function CalendarDatePicker13() {
  const [date, setDate] = useState<Date | undefined>(() => new Date());

  return (
    <AnimatedCalendar
      mode='single'
      selected={date}
      onSelect={setDate}
      className='bg-card hairline-ring ring-border rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      fixedWeeks
      showWeekNumber
      components={{ WeekNumber }}
    />
  );
}
