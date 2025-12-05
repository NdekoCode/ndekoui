'use client';

import { getLocalTimeZone, today } from '@internationalized/date';
import {
  Button as ButtonRac,
  CalendarCell as CalendarCellRac,
  CalendarGridBody as CalendarGridBodyRac,
  CalendarGridHeader as CalendarGridHeaderRac,
  CalendarGrid as CalendarGridRac,
  CalendarHeaderCell as CalendarHeaderCellRac,
  Calendar as CalendarRac,
  composeRenderProps,
  Heading as HeadingRac,
  RangeCalendar as RangeCalendarRac,
  type CalendarProps as CalendarRacProps,
  type DateValue,
  type RangeCalendarProps as RangeCalendarRacProps,
} from 'react-aria-components';

import { ChevronLeftIcon, ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

const NAV_BUTTON =
  'flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-[color,background-color,box-shadow,scale] duration-150 ease-(--ease-out-strong) data-hovered:bg-foreground/5 data-hovered:text-foreground data-pressed:scale-[0.97] data-focus-visible:ring-[3px] data-focus-visible:ring-ring/25';

function CalendarHeader() {
  return (
    <header className='flex w-full items-center gap-1 pb-1'>
      <ButtonRac slot='previous' className={NAV_BUTTON}>
        <ChevronLeftIcon className='size-4' />
      </ButtonRac>
      <HeadingRac className='grow text-center text-[13px] font-medium' />
      <ButtonRac slot='next' className={NAV_BUTTON}>
        <ChevronRightIcon className='size-4' />
      </ButtonRac>
    </header>
  );
}

const CELL = [
  'relative flex size-9 items-center justify-center whitespace-nowrap rounded-md p-0 text-[13px] font-normal tabular-nums text-foreground outline-none',
  'transition-[color,background-color,border-radius,box-shadow,scale] duration-150 ease-(--ease-out-strong) data-pressed:scale-90',
  'data-hovered:bg-foreground/5 data-selected:bg-primary data-selected:text-primary-foreground',
  'data-focus-visible:z-10 data-focus-visible:ring-[3px] data-focus-visible:ring-ring/25',
  'data-disabled:pointer-events-none data-disabled:opacity-30',
  'data-unavailable:pointer-events-none data-unavailable:line-through data-unavailable:opacity-30',
].join(' ');

const RANGE_CELL = [
  'data-selected:rounded-none data-selected:bg-primary/[0.08] data-selected:text-foreground',
  'data-selection-start:rounded-s-md data-selection-start:bg-primary data-selection-start:text-primary-foreground',
  'data-selection-end:rounded-e-md data-selection-end:bg-primary data-selection-end:text-primary-foreground',
  'data-invalid:bg-destructive/10 data-invalid:data-selection-start:bg-destructive data-invalid:data-selection-end:bg-destructive',
].join(' ');

const TODAY_DOT =
  'after:pointer-events-none after:absolute after:start-1/2 after:bottom-1 after:z-10 after:size-[3px] after:-translate-x-1/2 after:rounded-full after:bg-primary';

const TODAY_DOT_ON_SELECTION = 'data-selected:after:bg-primary-foreground';

const TODAY_DOT_ON_RANGE_EDGE =
  'data-selection-end:after:bg-primary-foreground data-selection-start:after:bg-primary-foreground';

function todayDotOf(isRange: boolean) {
  if (isRange) {
    return cn(TODAY_DOT, TODAY_DOT_ON_RANGE_EDGE);
  }
  return cn(TODAY_DOT, TODAY_DOT_ON_SELECTION);
}

function CalendarGrid({ isRange = false }: { isRange?: boolean }) {
  const now = today(getLocalTimeZone());

  return (
    <CalendarGridRac>
      <CalendarGridHeaderRac>
        {(day) => (
          <CalendarHeaderCellRac className='text-muted-foreground size-9 rounded-md p-0 text-xs font-medium'>
            {day}
          </CalendarHeaderCellRac>
        )}
      </CalendarGridHeaderRac>
      <CalendarGridBodyRac className='[&_td]:px-0 [&_td]:py-px'>
        {(date) => {
          const isToday = date.compare(now) === 0;
          return (
            <CalendarCellRac
              date={date}
              className={cn(
                CELL,
                isRange && RANGE_CELL,
                isToday && todayDotOf(isRange)
              )}
            />
          );
        }}
      </CalendarGridBodyRac>
    </CalendarGridRac>
  );
}

type CalendarProps<T extends DateValue> = Omit<
  CalendarRacProps<T>,
  'className'
> & {
  className?: string;
};

type RangeCalendarProps<T extends DateValue> = Omit<
  RangeCalendarRacProps<T>,
  'className'
> & {
  className?: string;
};

function Calendar<T extends DateValue>({
  className,
  ...props
}: CalendarProps<T>) {
  return (
    <CalendarRac
      {...props}
      className={composeRenderProps(className, (value) => cn('w-fit', value))}
    >
      <CalendarHeader />
      <CalendarGrid />
    </CalendarRac>
  );
}

function RangeCalendar<T extends DateValue>({
  className,
  ...props
}: RangeCalendarProps<T>) {
  return (
    <RangeCalendarRac
      {...props}
      className={composeRenderProps(className, (value) => cn('w-fit', value))}
    >
      <CalendarHeader />
      <CalendarGrid isRange />
    </RangeCalendarRac>
  );
}

export { Calendar, RangeCalendar };
