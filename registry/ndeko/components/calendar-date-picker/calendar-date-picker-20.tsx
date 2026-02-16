'use client';

import { subDays, subMonths, subYears } from 'date-fns';
import { useState } from 'react';

import { Button } from '@/registry/ndeko/ui/button';

import { AnimatedCalendar } from './_parts/animated-calendar';

const PRESETS = [
  { label: 'Today', dateFrom: (today: Date) => today },
  { label: 'Yesterday', dateFrom: (today: Date) => subDays(today, 1) },
  { label: 'Last week', dateFrom: (today: Date) => subDays(today, 7) },
  { label: 'Last month', dateFrom: (today: Date) => subMonths(today, 1) },
  { label: 'Last year', dateFrom: (today: Date) => subYears(today, 1) },
];

type Preset = (typeof PRESETS)[number];

export default function CalendarDatePicker20() {
  const [today] = useState(() => new Date());
  const [month, setMonth] = useState(today);
  const [date, setDate] = useState(today);

  function applyPreset(preset: Preset) {
    const presetDate = preset.dateFrom(today);
    setDate(presetDate);
    setMonth(presetDate);
  }

  function pickDay(day: Date | undefined) {
    if (!day) {
      return;
    }
    setDate(day);
  }

  return (
    <div className='bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex max-sm:flex-col'>
        <div className='max-sm:hairline-t border-border relative py-4 max-sm:order-1 sm:w-32'>
          <div className='sm:hairline-r border-border h-full'>
            <div className='flex flex-col px-2'>
              {PRESETS.map((preset) => (
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
          mode='single'
          selected={date}
          onSelect={pickDay}
          month={month}
          onMonthChange={setMonth}
          className='p-2'
          disabled={[{ after: today }]}
        />
      </div>
    </div>
  );
}
