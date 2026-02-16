'use client';

import { useId, useState } from 'react';

import { ClockIcon } from '@/registry/ndeko/lib/icons';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';

import { AnimatedCalendar } from './_parts/animated-calendar';

export default function CalendarDatePicker17() {
  const id = useId();
  const [date, setDate] = useState<Date | undefined>(() => new Date());

  return (
    <div className='bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <AnimatedCalendar
        mode='single'
        className='p-2'
        selected={date}
        onSelect={setDate}
      />
      <div className='flex items-center gap-3 px-3 pt-1 pb-3'>
        <Label htmlFor={id} className='text-xs'>
          Enter time
        </Label>
        <div className='relative grow'>
          <Input
            id={id}
            type='time'
            step='1'
            defaultValue='12:00:00'
            className='peer appearance-none ps-8 tabular-nums [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
          />
          <span className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex w-8 items-center justify-center peer-disabled:opacity-50'>
            <ClockIcon className='size-4' />
          </span>
        </div>
      </div>
    </div>
  );
}
