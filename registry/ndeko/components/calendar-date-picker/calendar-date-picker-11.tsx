'use client';

import { useState } from 'react';
import type { DropdownNavProps, DropdownProps } from 'react-day-picker';

import { cn } from '@/registry/ndeko/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

import { AnimatedCalendar } from './_parts/animated-calendar';

const FIRST_MONTH = new Date(1980, 6);

type CalendarSelectProps = DropdownProps & { grow?: boolean };

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

function CalendarSelect({
  value,
  onChange,
  options = [],
  grow = false,
  'aria-label': ariaLabel,
}: CalendarSelectProps) {
  const selectedValue = Number(value);

  return (
    <Select
      items={options}
      value={selectedValue}
      onValueChange={(nextValue) => emitChange(onChange, nextValue)}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn('w-fit font-medium', grow && 'grow')}
      >
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

function MonthSelect(props: DropdownProps) {
  return <CalendarSelect {...props} grow />;
}

function YearSelect(props: DropdownProps) {
  return <CalendarSelect {...props} />;
}

function SelectsNav({ children }: DropdownNavProps) {
  return <div className='flex w-full items-center gap-2'>{children}</div>;
}

export default function CalendarDatePicker11() {
  const [date, setDate] = useState<Date | undefined>(() => new Date());

  return (
    <AnimatedCalendar
      mode='single'
      selected={date}
      onSelect={setDate}
      className='bg-card hairline-ring ring-border rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      classNames={{ month_caption: 'mx-0' }}
      captionLayout='dropdown'
      defaultMonth={date}
      startMonth={FIRST_MONTH}
      hideNavigation
      components={{
        DropdownNav: SelectsNav,
        MonthsDropdown: MonthSelect,
        YearsDropdown: YearSelect,
      }}
    />
  );
}
