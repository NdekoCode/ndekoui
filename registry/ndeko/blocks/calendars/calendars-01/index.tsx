'use client';

import { isSameMonth, startOfMonth } from 'date-fns';
import { useState } from 'react';

import {
  defaultStartOf,
  DefaultEventColor,
  EventCalendar,
  useEventEditor,
  useEventList,
  type CalendarEvent,
  type EventColor,
} from '@/registry/ndeko/components/event-calendar/_parts';
import { MenuIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/registry/ndeko/ui/sheet';

import { CalendarSidebar } from './calendar-sidebar';
import { buildCalendarEvents, CALENDAR_OPTIONS, CALENDARS } from './data';

function colorOf(event: CalendarEvent) {
  return event.color ?? DefaultEventColor;
}

function isShownIn(event: CalendarEvent, hiddenColors: EventColor[]) {
  return !hiddenColors.includes(colorOf(event));
}

export default function Calendar01() {
  const { events, addEvent, updateEvent, deleteEvent } =
    useEventList(buildCalendarEvents);
  const [date, setDate] = useState(() => new Date());
  const [shownMonth, setShownMonth] = useState(() => startOfMonth(new Date()));
  const [hiddenColors, setHiddenColors] = useState<EventColor[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const shownEvents = events.filter((event) => isShownIn(event, hiddenColors));

  function showCalendarOf(event: CalendarEvent) {
    const color = colorOf(event);
    setHiddenColors((current) =>
      current.filter((hiddenColor) => hiddenColor !== color)
    );
  }

  function addAndShow(event: CalendarEvent) {
    addEvent(event);
    showCalendarOf(event);
  }

  function updateAndShow(event: CalendarEvent) {
    updateEvent(event);
    showCalendarOf(event);
  }

  const editor = useEventEditor({
    events: shownEvents,
    onEventAdd: addAndShow,
    onEventUpdate: updateAndShow,
    onEventDelete: deleteEvent,
  });

  function changeDate(nextDate: Date) {
    setDate(nextDate);
    if (!isSameMonth(nextDate, shownMonth)) {
      setShownMonth(startOfMonth(nextDate));
    }
  }

  function pickDay(day: Date) {
    changeDate(day);
    setIsSidebarOpen(false);
  }

  function toggleCalendar(color: EventColor) {
    setHiddenColors((current) => {
      if (current.includes(color)) {
        return current.filter((hiddenColor) => hiddenColor !== color);
      }
      return [...current, color];
    });
  }

  function showAllCalendars() {
    setHiddenColors([]);
  }

  function createEvent() {
    setIsSidebarOpen(false);
    const start = defaultStartOf(date);
    editor.openNewEvent(start);
  }

  const sidebarProps = {
    events: shownEvents,
    date,
    shownMonth,
    onShownMonthChange: setShownMonth,
    onPickDay: pickDay,
    calendars: CALENDARS,
    hiddenColors,
    onToggleCalendar: toggleCalendar,
    onShowAllCalendars: showAllCalendars,
    onCreate: createEvent,
  };

  const sidebarToggle = (
    <Button
      variant='ghost'
      size='icon'
      className='lg:hidden'
      aria-label='Open calendars'
      onClick={() => setIsSidebarOpen(true)}
    >
      <MenuIcon />
    </Button>
  );

  return (
    <div className='bg-sidebar text-foreground flex h-dvh min-h-0 w-full gap-2 p-2'>
      <aside
        aria-label='Calendars'
        className='hidden w-64 shrink-0 overflow-y-auto px-1 py-2 lg:block'
      >
        <CalendarSidebar {...sidebarProps} />
      </aside>
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side='left' className='bg-sidebar w-80 p-4 pt-12'>
          <SheetTitle className='sr-only'>Calendars</SheetTitle>
          <CalendarSidebar {...sidebarProps} />
        </SheetContent>
      </Sheet>
      <main className='flex min-w-0 flex-1 flex-col'>
        <EventCalendar
          fillHeight
          events={shownEvents}
          onEventAdd={addAndShow}
          onEventUpdate={updateAndShow}
          onEventDelete={deleteEvent}
          editor={editor}
          date={date}
          onDateChange={changeDate}
          colorOptions={CALENDAR_OPTIONS}
          colorLegend='Calendar'
          headerStart={sidebarToggle}
          newEventClassName='lg:hidden'
        />
      </main>
    </div>
  );
}
