'use client';

import { format, parse } from 'date-fns';
import { useId, useState } from 'react';

import { CalendarIcon } from '@/registry/ndeko/lib/icons';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';

import { AnimatedCalendar } from './_parts/animated-calendar';

const INPUT_FORMAT = 'yyyy-MM-dd';

function todayAsInputValue() {
  return format(new Date(), INPUT_FORMAT);
}

export default function CalendarDatePicker16() {
  const id = useId();
  const [month, setMonth] = useState(() => new Date());
  const [date, setDate] = useState<Date | undefined>(() => new Date());
  const [inputValue, setInputValue] = useState(todayAsInputValue);

  function selectDay(day: Date | undefined) {
    if (!day) {
      setInputValue('');
      setDate(undefined);
      return;
    }
    setDate(day);
    setMonth(day);
    setInputValue(format(day, INPUT_FORMAT));
  }

  function typeDate(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setInputValue(value);
    if (!value) {
      setDate(undefined);
      return;
    }
    const typedDate = parse(value, INPUT_FORMAT, new Date());
    setDate(typedDate);
    setMonth(typedDate);
  }

  return (
    <div className='bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <AnimatedCalendar
        mode='single'
        className='p-2'
        selected={date}
        onSelect={selectDay}
        month={month}
        onMonthChange={setMonth}
      />
      <div className='flex items-center gap-3 px-3 pt-1 pb-3'>
        <Label htmlFor={id} className='text-xs'>
          Enter date
        </Label>
        <div className='relative grow'>
          <Input
            id={id}
            type='date'
            value={inputValue}
            onChange={typeDate}
            className='peer appearance-none ps-8 tabular-nums [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
          />
          <span className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex w-8 items-center justify-center peer-disabled:opacity-50'>
            <CalendarIcon className='size-4' />
          </span>
        </div>
      </div>
    </div>
  );
}
