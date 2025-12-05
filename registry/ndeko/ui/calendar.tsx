'use client';

import { DayPicker } from 'react-day-picker';

import { ChevronLeftIcon, ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { buttonVariants } from '@/registry/ndeko/ui/button';

type CalendarProps = React.ComponentProps<typeof DayPicker>;

type CalendarClassNames = NonNullable<CalendarProps['classNames']>;

const NAV_BUTTON = cn(
  buttonVariants({ variant: 'ghost', size: 'icon' }),
  'text-muted-foreground hover:text-foreground'
);

const DAY_BUTTON = [
  'relative flex size-9 items-center justify-center whitespace-nowrap rounded-md p-0 text-[13px] tabular-nums text-foreground outline-none',
  'transition-[color,background-color,border-radius,box-shadow,scale] duration-150 ease-(--ease-out-strong) hover:not-in-data-selected:bg-foreground/5 active:scale-90',
  'focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-ring/25',
  'group-data-selected:bg-primary group-data-selected:text-primary-foreground',
  'group-data-disabled:pointer-events-none group-data-disabled:text-foreground/30 group-data-disabled:line-through',
  'group-data-outside:text-foreground/30 group-data-selected:group-data-outside:text-primary-foreground',
  'group-[.range-start:not(.range-end)]:rounded-e-none group-[.range-end:not(.range-start)]:rounded-s-none',
  'group-[.range-middle]:rounded-none group-[.range-middle]:group-data-selected:bg-primary/[0.08] group-[.range-middle]:group-data-selected:text-foreground',
].join(' ');

const TODAY = [
  '*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-primary *:after:transition-colors',
  '[&[data-selected]:not(.range-middle)>*]:after:bg-primary-foreground [&[data-disabled]>*]:after:bg-foreground/30',
].join(' ');

const DEFAULT_CLASS_NAMES: Record<string, string> = {
  months: 'relative flex flex-col gap-4 sm:flex-row',
  month: 'w-full',
  month_caption:
    'relative z-20 mx-10 mb-1 flex h-9 items-center justify-center',
  caption_label: 'text-[13px] font-medium',
  nav: 'absolute top-0 z-10 flex w-full justify-between',
  button_previous: NAV_BUTTON,
  button_next: NAV_BUTTON,
  weekday: 'size-9 p-0 text-xs font-medium text-muted-foreground',
  day_button: DAY_BUTTON,
  day: 'group size-9 px-0 py-px text-[13px]',
  range_start: 'range-start',
  range_end: 'range-end',
  range_middle: 'range-middle',
  today: TODAY,
  outside:
    'text-muted-foreground data-selected:bg-primary/[0.08] data-selected:text-muted-foreground',
  hidden: 'invisible',
  week_number: 'size-9 p-0 text-xs font-medium text-muted-foreground',
};

function mergeClassNames(overrides: CalendarClassNames | undefined) {
  const merged: Record<string, string> = { ...DEFAULT_CLASS_NAMES };
  if (!overrides) {
    return merged;
  }
  for (const [key, value] of Object.entries(overrides)) {
    merged[key] = cn(DEFAULT_CLASS_NAMES[key], value);
  }
  return merged;
}

type ChevronProps = {
  className?: string;
  orientation?: 'left' | 'right' | 'up' | 'down';
};

function CalendarChevron({ className, orientation }: ChevronProps) {
  if (orientation === 'left') {
    return <ChevronLeftIcon className={cn('size-4', className)} />;
  }
  return <ChevronRightIcon className={cn('size-4', className)} />;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('w-fit', className)}
      classNames={mergeClassNames(classNames)}
      components={{ Chevron: CalendarChevron, ...components }}
      {...props}
    />
  );
}

export { Calendar };
