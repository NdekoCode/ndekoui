'use client';

import {
  Button,
  DateRangePicker,
  Dialog,
  Group,
  Label,
  Popover,
} from 'react-aria-components';

import { CalendarIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { RangeCalendar } from '@/registry/ndeko/ui/calendar-rac';
import { DateInput, dateInputStyle } from '@/registry/ndeko/ui/datefield-rac';
import { LABEL_RECIPE } from '@/registry/ndeko/ui/label';

import { SETTLING_DAYS } from './_parts/settling-days';

const CALENDAR_BUTTON = [
  'z-10 -ms-8 flex w-8 items-center justify-center rounded-e-md text-muted-foreground outline-none',
  'transition-[color,box-shadow] data-hovered:text-foreground data-focus-visible:ring-[3px] data-focus-visible:ring-ring/25',
].join(' ');

const POPOVER = [
  'surface-raised rounded-xl outline-none',
  'origin-(--trigger-anchor-point) transition-[opacity,scale] duration-150 ease-(--ease-out-strong)',
  'data-entering:scale-95 data-entering:opacity-0 data-exiting:scale-95 data-exiting:opacity-0 data-exiting:duration-100',
].join(' ');

export default function CalendarDatePicker26() {
  return (
    <DateRangePicker className='flex w-full max-w-xs flex-col gap-1.5'>
      <Label className={LABEL_RECIPE}>Date range picker</Label>
      <div className='flex'>
        <Group className={cn(dateInputStyle, 'pe-8')}>
          <DateInput slot='start' unstyled />
          <span aria-hidden='true' className='text-muted-foreground/75 px-2'>
            -
          </span>
          <DateInput slot='end' unstyled />
        </Group>
        <Button className={CALENDAR_BUTTON}>
          <CalendarIcon className='size-4' />
        </Button>
      </div>
      <Popover className={POPOVER} offset={6}>
        <Dialog className='max-h-[inherit] overflow-auto p-2 outline-none'>
          <AnimatedSize>
            <RangeCalendar className={SETTLING_DAYS} />
          </AnimatedSize>
        </Dialog>
      </Popover>
    </DateRangePicker>
  );
}
