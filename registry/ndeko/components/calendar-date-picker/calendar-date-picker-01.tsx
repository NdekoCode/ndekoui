'use client';

import { getLocalTimeZone, today } from '@internationalized/date';
import { useState } from 'react';
import type { DateValue } from 'react-aria-components';

import { cn } from '@/registry/ndeko/lib/utils';
import { Calendar } from '@/registry/ndeko/ui/calendar-rac';

import { SETTLING_DAYS } from './_parts/settling-days';

export default function CalendarDatePicker01() {
  const [date, setDate] = useState<DateValue | null>(() =>
    today(getLocalTimeZone())
  );

  return (
    <Calendar
      className={cn(
        'bg-card hairline-ring ring-border rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        SETTLING_DAYS
      )}
      value={date}
      onChange={setDate}
    />
  );
}
