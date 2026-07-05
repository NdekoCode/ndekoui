'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useId } from 'react';

import {
  MiniMonth,
  type CalendarEvent,
  type EventColor,
} from '@/registry/ndeko/components/event-calendar/_parts';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';

import type { CalendarSource } from './data';

const ROW =
  'flex h-8 w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-md px-2 text-[13px] font-medium transition-colors duration-150 hover:bg-foreground/5';

const FADE_IN: Transition = { duration: 0.15, ease: [0.23, 1, 0.32, 1] };
const FADE_OUT: Transition = { duration: 0.1, ease: [0.23, 1, 0.32, 1] };

/** The checkbox takes the colour of its calendar instead of the brand fill. */
function calendarTintOf(color: EventColor) {
  return { '--primary': `var(--${color})` } as React.CSSProperties;
}

type CalendarRowProps = {
  calendar: CalendarSource;
  isShown: boolean;
  onToggle: (color: EventColor) => void;
};

function CalendarRow({ calendar, isShown, onToggle }: CalendarRowProps) {
  return (
    <li>
      <label className={ROW}>
        <Checkbox
          checked={isShown}
          onCheckedChange={() => onToggle(calendar.color)}
          style={calendarTintOf(calendar.color)}
        />
        <span className='min-w-0 flex-1 truncate'>{calendar.name}</span>
      </label>
    </li>
  );
}

type CalendarListProps = {
  calendars: CalendarSource[];
  hiddenColors: EventColor[];
  onToggle: (color: EventColor) => void;
  onShowAll: () => void;
};

function CalendarList({
  calendars,
  hiddenColors,
  onToggle,
  onShowAll,
}: CalendarListProps) {
  const headingId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const hasHidden = hiddenColors.length > 0;
  let exitTransition = FADE_OUT;
  if (shouldReduceMotion) {
    exitTransition = { duration: 0 };
  }

  return (
    <section aria-labelledby={headingId} className='flex flex-col gap-1'>
      <div className='flex h-7 items-center justify-between gap-2 ps-2'>
        <h2
          id={headingId}
          className='text-muted-foreground text-xs font-medium'
        >
          My calendars
        </h2>
        <AnimatePresence initial={false}>
          {hasHidden && (
            <motion.div
              key='show-all'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: FADE_IN }}
              exit={{ opacity: 0, transition: exitTransition }}
            >
              <Button variant='ghost' size='sm' onClick={onShowAll}>
                Show all
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ul className='flex flex-col gap-px'>
        {calendars.map((calendar) => (
          <CalendarRow
            key={calendar.color}
            calendar={calendar}
            isShown={!hiddenColors.includes(calendar.color)}
            onToggle={onToggle}
          />
        ))}
      </ul>
    </section>
  );
}

type CalendarSidebarProps = {
  events: CalendarEvent[];
  date: Date;
  shownMonth: Date;
  onShownMonthChange: (month: Date) => void;
  onPickDay: (day: Date) => void;
  calendars: CalendarSource[];
  hiddenColors: EventColor[];
  onToggleCalendar: (color: EventColor) => void;
  onShowAllCalendars: () => void;
  onCreate: () => void;
};

/** New event, a month that moves the main calendar, and the calendars that filter it. */
export function CalendarSidebar({
  events,
  date,
  shownMonth,
  onShownMonthChange,
  onPickDay,
  calendars,
  hiddenColors,
  onToggleCalendar,
  onShowAllCalendars,
  onCreate,
}: CalendarSidebarProps) {
  return (
    <div className='flex flex-col gap-5'>
      <Button size='lg' className='w-full' onClick={onCreate}>
        <PlusIcon />
        New event
      </Button>
      <MiniMonth
        events={events}
        selected={date}
        onSelect={onPickDay}
        month={shownMonth}
        onMonthChange={onShownMonthChange}
        className='mx-auto'
      />
      <CalendarList
        calendars={calendars}
        hiddenColors={hiddenColors}
        onToggle={onToggleCalendar}
        onShowAll={onShowAllCalendars}
      />
    </div>
  );
}
