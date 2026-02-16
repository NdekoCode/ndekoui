'use client';

import { subDays } from 'date-fns';
import { useState } from 'react';

import { Button } from '@/registry/ndeko/ui/button';

import { AnimatedCalendar } from './_parts/animated-calendar';

function fourWeeksAgo() {
  return subDays(new Date(), 28);
}

export default function CalendarDatePicker14() {
  const [month, setMonth] = useState(fourWeeksAgo);
  const [date, setDate] = useState<Date | undefined>(fourWeeksAgo);

  return (
    <div className='bg-card hairline-ring ring-border rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <AnimatedCalendar
        mode='single'
        selected={date}
        onSelect={setDate}
        month={month}
        onMonthChange={setMonth}
      />
      <Button
        variant='outline'
        size='sm'
        className='mt-2 mb-1'
        onClick={() => setMonth(new Date())}
      >
        Current month
      </Button>
    </div>
  );
}
