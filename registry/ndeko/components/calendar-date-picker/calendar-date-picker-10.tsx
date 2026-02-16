'use client';

import { useState } from 'react';

import { AnimatedCalendar } from './_parts/animated-calendar';

const NAVIGATION_ON_THE_RIGHT = {
  month_caption: 'ms-2.5 me-20 justify-start',
  nav: 'justify-end',
};

export default function CalendarDatePicker10() {
  const [date, setDate] = useState<Date | undefined>(() => new Date());

  return (
    <AnimatedCalendar
      mode='single'
      selected={date}
      onSelect={setDate}
      className='bg-card hairline-ring ring-border rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      classNames={NAVIGATION_ON_THE_RIGHT}
    />
  );
}
