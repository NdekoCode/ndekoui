'use client';

import { useState } from 'react';
import type { DropdownNavProps, DropdownProps } from 'react-day-picker';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

import { AnimatedCalendar } from './_parts/animated-calendar';

const FIRST_MONTH = new Date(1980, 6);

function emitChange(onChange: DropdownProps['onChange'], value: number | null) {
  if (value === null) {
    return;
  }
  if (!onChange) {
    return;
  }
  const changeEvent = {
    target: { value: String(value) },
  } as React.ChangeEvent<HTMLSelectElement>;
  onChange(changeEvent);
}

function YearSelect({
  value,
  onChange,
  options = [],
  'aria-label': ariaLabel,
}: DropdownProps) {
  const selectedYear = Number(value);

  return (
    <Select
      items={options}
      value={selectedYear}
      onValueChange={(nextYear) => emitChange(onChange, nextYear)}
    >
      <SelectTrigger aria-label={ariaLabel} className='w-fit font-medium'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='max-h-[min(26rem,var(--available-height))]'>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function YearNav({ children }: DropdownNavProps) {
  return (
    <div className='flex w-full items-center justify-center gap-3 [&>span]:text-[13px] [&>span]:font-medium'>
      {children}
    </div>
  );
}

export default function CalendarDatePicker12() {
  const [date, setDate] = useState<Date | undefined>(() => new Date());

  return (
    <AnimatedCalendar
      mode='single'
      selected={date}
      onSelect={setDate}
      className='bg-card hairline-ring ring-border rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      captionLayout='dropdown-years'
      defaultMonth={date}
      startMonth={FIRST_MONTH}
      components={{ DropdownNav: YearNav, YearsDropdown: YearSelect }}
    />
  );
}
