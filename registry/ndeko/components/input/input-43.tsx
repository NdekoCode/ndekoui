'use client';

import {
  getLocalTimeZone,
  isWeekend,
  today,
  type CalendarDate,
} from '@internationalized/date';
import { useLocale } from 'react-aria';
import {
  Button,
  DateRangePicker,
  Dialog,
  FieldError,
  Group,
  Label,
  Popover,
  type DateValue,
} from 'react-aria-components';

import { CalendarIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { RangeCalendar } from '@/registry/ndeko/ui/calendar-rac';
import { DateInput, dateInputStyle } from '@/registry/ndeko/ui/datefield-rac';
import { LABEL_RECIPE } from '@/registry/ndeko/ui/label';

type DateRange = { start: DateValue; end: DateValue };

const CALENDAR_BUTTON =
  'text-muted-foreground data-hovered:bg-foreground/5 data-hovered:text-foreground data-focus-visible:ring-ring/25 absolute inset-y-0 end-1 z-10 my-auto flex size-6 items-center justify-center rounded-md outline-none transition-[color,background-color,box-shadow] data-focus-visible:ring-[3px]';

const POPOVER =
  'surface-raised z-50 origin-(--trigger-anchor-point) rounded-xl p-2 outline-none transition-[opacity,scale] duration-150 ease-(--ease-out-strong) data-entering:scale-95 data-entering:opacity-0 data-exiting:scale-95 data-exiting:opacity-0 data-exiting:duration-100';

const RANGE_ERROR =
  'text-destructive-ink text-xs transition-[opacity,translate] duration-200 ease-(--ease-out-strong) starting:-translate-y-0.5 starting:opacity-0';

const UNAVAILABLE_MESSAGE =
  'This range includes booked days. Pick dates around them.';

function bookedRangesFrom(now: CalendarDate): DateRange[] {
  return [
    { start: now, end: now.add({ days: 5 }) },
    { start: now.add({ days: 14 }), end: now.add({ days: 16 }) },
    { start: now.add({ days: 23 }), end: now.add({ days: 24 }) },
  ];
}

function isInsideRange(date: DateValue, range: DateRange) {
  const isAfterStart = date.compare(range.start) >= 0;
  const isBeforeEnd = date.compare(range.end) <= 0;
  return isAfterStart && isBeforeEnd;
}

function rangesOverlap(first: DateRange, second: DateRange) {
  const endsAfterStart = first.end.compare(second.start) >= 0;
  const startsBeforeEnd = first.start.compare(second.end) <= 0;
  return endsAfterStart && startsBeforeEnd;
}

export default function Input43() {
  const { locale } = useLocale();
  const now = today(getLocalTimeZone());
  const bookedRanges = bookedRangesFrom(now);

  function isDateUnavailable(date: DateValue) {
    const isBooked = bookedRanges.some((range) => isInsideRange(date, range));
    const isOnWeekend = isWeekend(date, locale);
    return isBooked || isOnWeekend;
  }

  function validateRange(value: DateRange | null) {
    if (!value) {
      return null;
    }
    const overlapsBooking = bookedRanges.some((range) =>
      rangesOverlap(value, range)
    );
    if (overlapsBooking) {
      return UNAVAILABLE_MESSAGE;
    }
    return null;
  }

  return (
    <DateRangePicker
      className='flex w-full max-w-xs flex-col gap-1.5'
      isDateUnavailable={isDateUnavailable}
      validate={validateRange}
    >
      <Label className={LABEL_RECIPE}>Stay dates</Label>
      <Group className={cn(dateInputStyle, 'pe-8')}>
        <DateInput slot='start' unstyled />
        <span aria-hidden='true' className='text-muted-foreground/75 px-1.5'>
          –
        </span>
        <DateInput slot='end' unstyled />
        <Button className={CALENDAR_BUTTON}>
          <CalendarIcon className='size-4' />
        </Button>
      </Group>
      <FieldError className={RANGE_ERROR} />
      <Popover className={POPOVER} offset={6}>
        <Dialog className='max-h-[inherit] overflow-auto outline-none'>
          <RangeCalendar minValue={now} isDateUnavailable={isDateUnavailable} />
        </Dialog>
      </Popover>
    </DateRangePicker>
  );
}
