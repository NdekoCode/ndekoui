'use client';

import { useAnimate, type Transition } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';

import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

import { AgendaView } from './agenda-view';
import { CalendarDndProvider } from './calendar-dnd-context';
import { CalendarHeader } from './calendar-header';
import {
  AllViews,
  EventGap,
  EventHeight,
  ScrollAreaHeight,
  WeekCellsHeight,
} from './constants';
import { DayEventsPanel } from './day-events-panel';
import { DayView } from './day-view';
import { EventDialog } from './event-dialog';
import { MonthView } from './month-view';
import { periodKeyOf, shiftDate } from './navigation';
import type { CalendarEvent, CalendarView, EventColorOption } from './types';
import { useEventEditor, type EventEditor } from './use-event-editor';
import { defaultStartOf } from './utils';
import { ViewSwitcher } from './view-switcher';
import { WeekView } from './week-view';
import { YearView } from './year-view';

export type EventCalendarProps = {
  events?: CalendarEvent[];
  onEventAdd?: (event: CalendarEvent) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
  className?: string;
  initialView?: CalendarView;
  /** The views people can switch between, in this order. A single view hides the switcher. */
  views?: CalendarView[];
  /** The day the calendar shows, when the parent drives it, for example from a mini month. */
  date?: Date;
  onDateChange?: (date: Date) => void;
  /** Fills the height of its parent, each view scrolling inside, as in an app shell. */
  fillHeight?: boolean;
  /** An editor from `useEventEditor`, when something outside the calendar also opens the dialog. */
  editor?: EventEditor;
  /** Named colours for the dialog, such as the calendars of an app. */
  colorOptions?: EventColorOption[];
  colorLegend?: string;
  /** Placed before Today in the header. */
  headerStart?: React.ReactNode;
  newEventClassName?: string;
};

const ROOT =
  '@container bg-card hairline-ring ring-border flex w-full min-w-0 flex-col rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

const VIEW_FADE: Transition = { duration: 0.16, ease: [0.23, 1, 0.32, 1] };

/** The new period starts slightly faded rather than blank, so quick clicks never flash. */
const FADE_FROM_OPACITY = 0.35;

const SHORTCUT_VIEWS: Record<string, CalendarView | undefined> = {
  d: 'day',
  w: 'week',
  m: 'month',
  y: 'year',
  a: 'agenda',
};

const TODAY_SHORTCUT = 't';

function isTypingTarget(target: EventTarget) {
  const isInput = target instanceof HTMLInputElement;
  const isTextArea = target instanceof HTMLTextAreaElement;
  const isEditable = target instanceof HTMLElement && target.isContentEditable;
  return isInput || isTextArea || isEditable;
}

function hasModifierKey(keyEvent: React.KeyboardEvent) {
  const modifiers = [keyEvent.metaKey, keyEvent.ctrlKey, keyEvent.altKey];
  return modifiers.some(Boolean);
}

/** Keys pressed in the dialog or a popover bubble through React portals; only the calendar's own DOM counts. */
function isInsideRoot(target: EventTarget, root: HTMLElement | null) {
  if (!root) {
    return false;
  }
  if (!(target instanceof Node)) {
    return false;
  }
  return root.contains(target);
}

function isShortcutEvent(
  keyEvent: React.KeyboardEvent,
  root: HTMLElement | null
) {
  if (keyEvent.defaultPrevented) {
    return false;
  }
  if (hasModifierKey(keyEvent)) {
    return false;
  }
  if (isTypingTarget(keyEvent.target)) {
    return false;
  }
  return isInsideRoot(keyEvent.target, root);
}

function firstViewOf(initialView: CalendarView, views: CalendarView[]) {
  if (views.includes(initialView)) {
    return initialView;
  }
  return views[0] ?? initialView;
}

function scrollHeightOf(fillHeight: boolean) {
  if (fillHeight) {
    return 'none';
  }
  return ScrollAreaHeight;
}

function rootStyleOf(fillHeight: boolean) {
  return {
    '--event-height': `${EventHeight}px`,
    '--event-gap': `${EventGap}px`,
    '--week-cells-height': `${WeekCellsHeight}px`,
    '--calendar-scroll-height': scrollHeightOf(fillHeight),
  } as React.CSSProperties;
}

function directionTowards(target: Date, from: Date) {
  const difference = target.getTime() - from.getTime();
  return Math.sign(difference);
}

type ViewFadeProps = {
  changeKey: string;
  className?: string;
  children: React.ReactNode;
};

/** The new period or view replaces the old one in place, with a short fade and no sliding. */
function ViewFade({ changeKey, className, children }: ViewFadeProps) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const previousKeyRef = useRef(changeKey);

  useLayoutEffect(() => {
    if (previousKeyRef.current === changeKey) {
      return;
    }
    previousKeyRef.current = changeKey;
    animate(scope.current, { opacity: [FADE_FROM_OPACITY, 1] }, VIEW_FADE);
  }, [animate, changeKey, scope]);

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}

type ViewFrameProps = {
  fillHeight: boolean;
  changeKey: string;
  children: React.ReactNode;
};

function ViewFrame({ fillHeight, changeKey, children }: ViewFrameProps) {
  if (fillHeight) {
    return (
      <ViewFade changeKey={changeKey} className='flex min-h-0 flex-1 flex-col'>
        {children}
      </ViewFade>
    );
  }

  return (
    <AnimatedSize className='m-0 rounded-b-xl' contentClassName='p-0'>
      <ViewFade changeKey={changeKey} className='flex flex-col'>
        {children}
      </ViewFade>
    </AnimatedSize>
  );
}

type YearPaneProps = {
  currentDate: Date;
  events: CalendarEvent[];
  canOpenDay: boolean;
  onDaySelect: (day: Date) => void;
  onMonthSelect?: (month: Date) => void;
  onEventSelect: (event: CalendarEvent) => void;
  onEventCreate: (startTime: Date) => void;
};

/** With a day view the year opens the picked day; on its own it lists the picked day beside it. */
function YearPane({
  currentDate,
  events,
  canOpenDay,
  onDaySelect,
  onMonthSelect,
  onEventSelect,
  onEventCreate,
}: YearPaneProps) {
  if (canOpenDay) {
    return (
      <div className='hairline-t border-border flex min-h-0 flex-1 flex-col'>
        <YearView
          currentDate={currentDate}
          events={events}
          onDaySelect={onDaySelect}
          onMonthSelect={onMonthSelect}
        />
      </div>
    );
  }

  return (
    <div className='hairline-t border-border flex min-h-0 flex-1 flex-col @4xl:grid @4xl:grid-cols-[minmax(0,1fr)_18rem]'>
      <YearView
        currentDate={currentDate}
        events={events}
        onDaySelect={onDaySelect}
        onMonthSelect={onMonthSelect}
        selectedDay={currentDate}
      />
      <DayEventsPanel
        day={currentDate}
        events={events}
        onEventSelect={onEventSelect}
        onEventCreate={onEventCreate}
        className='hairline-t border-border @4xl:hairline-l px-2 py-4 @4xl:border-t-0 @4xl:py-5'
      />
    </div>
  );
}

type NewEventButtonProps = {
  className?: string;
  onClick: () => void;
};

function NewEventButton({ className, onClick }: NewEventButtonProps) {
  return (
    <Button
      className={cn('@max-md:w-8 @max-md:px-0', className)}
      onClick={onClick}
    >
      <PlusIcon />
      <span className='sr-only @md:not-sr-only'>New event</span>
    </Button>
  );
}

export function EventCalendar({
  events = [],
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  className,
  initialView = 'month',
  views = AllViews,
  date,
  onDateChange,
  fillHeight = false,
  editor,
  colorOptions,
  colorLegend,
  headerStart,
  newEventClassName,
}: EventCalendarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [ownDate, setOwnDate] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>(() =>
    firstViewOf(initialView, views)
  );
  const [direction, setDirection] = useState(0);
  const ownEditor = useEventEditor({
    events,
    onEventAdd,
    onEventUpdate,
    onEventDelete,
  });
  const activeEditor = editor ?? ownEditor;
  const currentDate = date ?? ownDate;
  const periodKey = periodKeyOf(currentDate, view);
  const canOpenDay = views.includes('day');
  const canOpenMonth = views.includes('month');
  const hasSwitcher = views.length > 1;

  function changeDate(nextDate: Date, nextDirection: number) {
    setOwnDate(nextDate);
    setDirection(nextDirection);
    onDateChange?.(nextDate);
  }

  function changeView(nextView: CalendarView) {
    setView(nextView);
    setDirection(0);
  }

  function navigate(step: number) {
    const nextDate = shiftDate(currentDate, view, step);
    changeDate(nextDate, step);
  }

  function goToToday() {
    const today = new Date();
    const todayKey = periodKeyOf(today, view);
    const isSamePeriod = todayKey === periodKey;
    let nextDirection = directionTowards(today, currentDate);
    if (isSamePeriod) {
      nextDirection = 0;
    }
    changeDate(today, nextDirection);
  }

  function selectDay(day: Date) {
    if (canOpenDay) {
      setView('day');
    }
    changeDate(day, 0);
  }

  function selectMonth(month: Date) {
    setView('month');
    changeDate(month, 0);
  }

  let openDay: ((day: Date) => void) | undefined;
  if (canOpenDay) {
    openDay = selectDay;
  }
  let openMonth: ((month: Date) => void) | undefined;
  if (canOpenMonth) {
    openMonth = selectMonth;
  }

  function createFromHeader() {
    const today = new Date();
    const todayKey = periodKeyOf(today, view);
    const isTodayInView = todayKey === periodKey;
    let anchorDay = currentDate;
    if (isTodayInView) {
      anchorDay = today;
    }
    const start = defaultStartOf(anchorDay);
    activeEditor.openNewEvent(start);
  }

  function handleShortcut(keyEvent: React.KeyboardEvent<HTMLDivElement>) {
    if (!isShortcutEvent(keyEvent, rootRef.current)) {
      return;
    }
    const key = keyEvent.key.toLowerCase();
    if (key === TODAY_SHORTCUT) {
      keyEvent.preventDefault();
      goToToday();
      return;
    }
    const nextView = SHORTCUT_VIEWS[key];
    if (!nextView) {
      return;
    }
    if (!views.includes(nextView)) {
      return;
    }
    keyEvent.preventDefault();
    changeView(nextView);
  }

  const viewProps = {
    currentDate,
    events,
    onEventSelect: activeEditor.openEvent,
    onEventCreate: activeEditor.openNewEvent,
  };

  return (
    <div
      ref={rootRef}
      data-slot='event-calendar'
      onKeyDown={handleShortcut}
      className={cn(ROOT, fillHeight && 'h-full min-h-0', className)}
      style={rootStyleOf(fillHeight)}
    >
      <CalendarDndProvider onEventUpdate={activeEditor.moveEvent}>
        <CalendarHeader
          view={view}
          date={currentDate}
          direction={direction}
          start={headerStart}
          onPrevious={() => navigate(-1)}
          onNext={() => navigate(1)}
          onToday={goToToday}
        >
          {hasSwitcher && (
            <ViewSwitcher
              views={views}
              value={view}
              onValueChange={changeView}
            />
          )}
          <NewEventButton
            className={newEventClassName}
            onClick={createFromHeader}
          />
        </CalendarHeader>

        <ViewFrame fillHeight={fillHeight} changeKey={`${view}-${periodKey}`}>
          {view === 'month' && (
            <MonthView
              {...viewProps}
              onDaySelect={openDay}
              fillHeight={fillHeight}
            />
          )}
          {view === 'week' && <WeekView {...viewProps} onDaySelect={openDay} />}
          {view === 'day' && <DayView {...viewProps} />}
          {view === 'year' && (
            <YearPane
              {...viewProps}
              canOpenDay={canOpenDay}
              onDaySelect={selectDay}
              onMonthSelect={openMonth}
            />
          )}
          {view === 'agenda' && (
            <AgendaView
              currentDate={currentDate}
              events={events}
              onEventSelect={activeEditor.openEvent}
            />
          )}
        </ViewFrame>

        <EventDialog
          {...activeEditor.dialogProps}
          colorOptions={colorOptions}
          colorLegend={colorLegend}
        />
      </CalendarDndProvider>
    </div>
  );
}
