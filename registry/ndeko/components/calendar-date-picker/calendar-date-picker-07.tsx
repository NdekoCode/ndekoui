'use client';

import { addDays, subDays } from 'date-fns';
import { useState } from 'react';

import { AnimatedCalendar } from './_parts/animated-calendar';

function plannedDays() {
  const today = new Date();
  return [
    subDays(today, 17),
    addDays(today, 2),
    addDays(today, 6),
    addDays(today, 8),
  ];
}

export default function CalendarDatePicker07() {
  const [days, setDays] = useState<Date[] | undefined>(plannedDays);

  return (
    <AnimatedCalendar
      mode='multiple'
      selected={days}
      onSelect={setDays}
      className='bg-card hairline-ring ring-border rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    />
  );
}
