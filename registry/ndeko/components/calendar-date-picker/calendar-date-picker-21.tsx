'use client';

import {
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from 'date-fns';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/registry/ndeko/ui/button';

import { AnimatedCalendar } from './_parts/animated-calendar';

type RangePreset = {
  label: string;
  rangeFrom: (today: Date) => { from: Date; to: Date };
};

function lastMonthOf(today: Date) {
  const previousMonth = subMonths(today, 1);
  return { from: startOfMonth(previousMonth), to: endOfMonth(previousMonth) };
}

function lastYearOf(today: Date) {
  const previousYear = subYears(today, 1);
  return { from: startOfYear(previousYear), to: endOfYear(previousYear) };
}

function lastSevenDaysOf(today: Date) {
  return { from: subDays(today, 6), to: today };
}

const RANGE_PRESETS: RangePreset[] = [
  { label: 'Today', rangeFrom: (today) => ({ from: today, to: today }) },
  {
    label: 'Yesterday',
    rangeFrom: (today) => ({ from: subDays(today, 1), to: subDays(today, 1) }),
  },
  { label: 'Last 7 days', rangeFrom: lastSevenDaysOf },
  {
    label: 'Last 30 days',
    rangeFrom: (today) => ({ from: subDays(today, 29), to: today }),
  },
  {
    label: 'Month to date',
    rangeFrom: (today) => ({ from: startOfMonth(today), to: today }),
  },
  { label: 'Last month', rangeFrom: lastMonthOf },
  {
    label: 'Year to date',
    rangeFrom: (today) => ({ from: startOfYear(today), to: today }),
  },
  { label: 'Last year', rangeFrom: lastYearOf },
];

export default function CalendarDatePicker21() {
  const [today] = useState(() => new Date());
  const [month, setMonth] = useState(today);
  const [range, setRange] = useState<DateRange | undefined>(() =>
    lastSevenDaysOf(today)
  );

  function applyPreset(preset: RangePreset) {
    const presetRange = preset.rangeFrom(today);
    setRange(presetRange);
    setMonth(presetRange.to);
  }

  function pickRange(nextRange: DateRange | undefined) {
    if (!nextRange) {
      return;
    }
    setRange(nextRange);
  }

  return (
    <div className='bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex max-sm:flex-col'>
        <div className='max-sm:hairline-t border-border relative py-4 max-sm:order-1 sm:w-32'>
          <div className='sm:hairline-r border-border h-full'>
            <div className='flex flex-col px-2'>
              {RANGE_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant='ghost'
                  size='sm'
                  className='w-full justify-start'
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <AnimatedCalendar
          mode='range'
          selected={range}
          onSelect={pickRange}
          month={month}
          onMonthChange={setMonth}
          className='p-2'
          disabled={[{ after: today }]}
        />
      </div>
    </div>
  );
}
