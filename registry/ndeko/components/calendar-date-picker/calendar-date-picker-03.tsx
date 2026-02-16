'use client';

import { getLocalTimeZone, isWeekend, today } from '@internationalized/date';
import { useLocale } from 'react-aria';
import type { DateValue } from 'react-aria-components';

import { cn } from '@/registry/ndeko/lib/utils';
import { RangeCalendar } from '@/registry/ndeko/ui/calendar-rac';

import { SETTLING_DAYS } from './_parts/settling-days';

const BOOKED_DAY_OFFSETS = [0, 14, 23];

export default function CalendarDatePicker03() {
  const { locale } = useLocale();
  const now = today(getLocalTimeZone());
  const bookedDays = BOOKED_DAY_OFFSETS.map((offset) =>
    now.add({ days: offset })
  );

  function isDateUnavailable(date: DateValue) {
    const isOnWeekend = isWeekend(date, locale);
    const isBooked = bookedDays.some((day) => date.compare(day) === 0);
    return isOnWeekend || isBooked;
  }

  return (
    <RangeCalendar
      className={cn(
        'bg-card hairline-ring ring-border rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        SETTLING_DAYS
      )}
      isDateUnavailable={isDateUnavailable}
      minValue={now}
    />
  );
}
