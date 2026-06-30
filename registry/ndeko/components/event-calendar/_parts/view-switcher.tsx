'use client';

import { cn } from '@/registry/ndeko/lib/utils';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import { ViewOptions } from './constants';
import type { CalendarView } from './types';

type ViewSwitcherProps = {
  views: CalendarView[];
  value: CalendarView;
  onValueChange: (view: CalendarView) => void;
  className?: string;
};

function isCalendarView(value: unknown): value is CalendarView {
  return ViewOptions.some((option) => option.view === value);
}

/**
 * A segmented control whose thumb travels to the chosen view. It takes a row of its own on
 * a narrow calendar and sits in the header row on a wide one.
 */
export function ViewSwitcher({
  views,
  value,
  onValueChange,
  className,
}: ViewSwitcherProps) {
  const options = ViewOptions.filter((option) => views.includes(option.view));

  function changeView(nextView: unknown) {
    if (isCalendarView(nextView)) {
      onValueChange(nextView);
    }
  }

  return (
    <Tabs
      value={value}
      onValueChange={changeView}
      className={cn('order-last w-full @2xl:order-none @2xl:w-auto', className)}
    >
      <TabsList
        variant='segmented'
        aria-label='Calendar view'
        className='w-full @2xl:w-fit'
      >
        {options.map((option) => (
          <TabsTab
            key={option.view}
            value={option.view}
            aria-keyshortcuts={option.shortcut}
            className='flex-1 px-2 @2xl:flex-none @2xl:px-3'
          >
            {option.label}
          </TabsTab>
        ))}
      </TabsList>
    </Tabs>
  );
}
