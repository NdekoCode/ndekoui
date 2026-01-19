'use client';

import {
  Button,
  DatePicker,
  Dialog,
  Group,
  Label,
  Popover,
} from 'react-aria-components';

import { CalendarIcon } from '@/registry/ndeko/lib/icons';
import { Calendar } from '@/registry/ndeko/ui/calendar-rac';
import { DateInput } from '@/registry/ndeko/ui/datefield-rac';
import { LABEL_RECIPE } from '@/registry/ndeko/ui/label';

const CALENDAR_BUTTON =
  'text-muted-foreground data-hovered:bg-foreground/5 data-hovered:text-foreground data-focus-visible:ring-ring/25 absolute inset-y-0 end-1 z-10 my-auto flex size-6 items-center justify-center rounded-md outline-none transition-[color,background-color,box-shadow] data-focus-visible:ring-[3px]';

const POPOVER =
  'surface-raised z-50 origin-(--trigger-anchor-point) rounded-xl p-2 outline-none transition-[opacity,scale] duration-150 ease-(--ease-out-strong) data-entering:scale-95 data-entering:opacity-0 data-exiting:scale-95 data-exiting:opacity-0 data-exiting:duration-100';

export default function Input41() {
  return (
    <DatePicker className='flex w-full max-w-xs flex-col gap-1.5'>
      <Label className={LABEL_RECIPE}>Due date</Label>
      <Group className='relative flex'>
        <DateInput className='pe-8' />
        <Button className={CALENDAR_BUTTON}>
          <CalendarIcon className='size-4' />
        </Button>
      </Group>
      <Popover className={POPOVER} offset={6}>
        <Dialog className='max-h-[inherit] overflow-auto outline-none'>
          <Calendar />
        </Dialog>
      </Popover>
    </DatePicker>
  );
}
