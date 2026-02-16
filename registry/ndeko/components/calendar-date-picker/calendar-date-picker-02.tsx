'use client';

import { getLocalTimeZone, today } from '@internationalized/date';
import { useState } from 'react';
import type { DateRange } from 'react-aria-components';

import { cn } from '@/registry/ndeko/lib/utils';
import { RangeCalendar } from '@/registry/ndeko/ui/calendar-rac';

import { SETTLING_DAYS } from './_parts/settling-days';

function threeDaysFromToday(): DateRange {
  const now = today(getLocalTimeZone());
  return { start: now, end: now.add({ days: 3 }) };
}

export default function CalendarDatePicker02() {
  const [range, setRange] = useState<DateRange | null>(threeDaysFromToday);

  return (
    <RangeCalendar
      className={cn(
        'bg-card hairline-ring ring-border rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        SETTLING_DAYS
      )}
      value={range}
      onChange={setRange}
    />
  );
}
