'use client';

import {
  addDays,
  addHours,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameMonth,
  startOfWeek,
} from 'date-fns';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  CalendarCheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Kbd } from '@/registry/ndeko/ui/kbd';

import { AgendaView } from './agenda-view';
import { CalendarDndProvider } from './calendar-dnd-context';
import {
  AgendaDaysToShow,
  EventGap,
  EventHeight,
  WeekCellsHeight,
} from './constants';
import { DayView } from './day-view';
import { EventDialog } from './event-dialog';
import { MonthView } from './month-view';
import type { CalendarEvent, CalendarView } from './types';
import { WeekView } from './week-view';

export type EventCalendarProps = {
  events?: CalendarEvent[];
  onEventAdd?: (event: CalendarEvent) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
  className?: string;
  initialView?: CalendarView;
};

type DialogState = {
  isOpen: boolean;
  event: CalendarEvent | null;
  session: number;
};

const VIEW_OPTIONS: { view: CalendarView; label: string; shortcut: string }[] =
  [
    { view: 'month', label: 'Month', shortcut: 'M' },
    { view: 'week', label: 'Week', shortcut: 'W' },
    { view: 'day', label: 'Day', shortcut: 'D' },
    { view: 'agenda', label: 'Agenda', shortcut: 'A' },
  ];

const SHORTCUT_VIEWS: Record<string, CalendarView | undefined> = {
  m: 'month',
  w: 'week',
  d: 'day',
  a: 'agenda',
};

const VIEW_SHIFT_PX = 12;
const TITLE_SHIFT_PX = 8;

const VIEW_TRANSITION: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };
const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const VIEW_AT_REST = { opacity: 1, x: 0 };

const TITLE_VARIANTS: Variants = {
  enter: (direction: number) => {
    const offset = direction * TITLE_SHIFT_PX;
    return { opacity: 0, x: offset };
  },
  visible: { opacity: 1, x: 0 },
  exit: (direction: number) => {
    const offset = direction * TITLE_SHIFT_PX;
    return { opacity: 0, x: -offset, transition: { duration: 0.1 } };
  },
};

const LABEL_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const IDLE_DIALOG: DialogState = { isOpen: false, event: null, session: 0 };

function isTypingTarget(target: EventTarget | null) {
  const isInput = target instanceof HTMLInputElement;
  const isTextArea = target instanceof HTMLTextAreaElement;
  const isEditable = target instanceof HTMLElement && target.isContentEditable;
  return isInput || isTextArea || isEditable;
}

function hasModifierKey(keyEvent: KeyboardEvent) {
  const modifiers = [keyEvent.metaKey, keyEvent.ctrlKey, keyEvent.altKey];
  return modifiers.some(Boolean);
}

function shiftDate(date: Date, view: CalendarView, step: number) {
  if (view === 'month') {
    return addMonths(date, step);
  }
  if (view === 'week') {
    return addWeeks(date, step);
  }
  if (view === 'day') {
    return addDays(date, step);
  }
  return addDays(date, step * AgendaDaysToShow);
}

function periodKeyOf(date: Date, view: CalendarView) {
  if (view === 'month') {
    return format(date, 'yyyy-MM');
  }
  if (view === 'week') {
    return format(startOfWeek(date, { weekStartsOn: 0 }), 'yyyy-MM-dd');
  }
  return format(date, 'yyyy-MM-dd');
}

function spanTitleOf(start: Date, end: Date) {
  if (isSameMonth(start, end)) {
    return format(start, 'MMMM yyyy');
  }
  return `${format(start, 'MMM')} - ${format(end, 'MMM yyyy')}`;
}

function textTitleOf(date: Date, view: CalendarView) {
  if (view === 'week') {
    const start = startOfWeek(date, { weekStartsOn: 0 });
    const end = endOfWeek(date, { weekStartsOn: 0 });
    return spanTitleOf(start, end);
  }
  if (view === 'agenda') {
    const end = addDays(date, AgendaDaysToShow - 1);
    return spanTitleOf(date, end);
  }
  return format(date, 'MMMM yyyy');
}

function ViewTitle({ date, view }: { date: Date; view: CalendarView }) {
  if (view !== 'day') {
    return <>{textTitleOf(date, view)}</>;
  }
  return (
    <>
      <span className='min-[480px]:hidden' aria-hidden='true'>
        {format(date, 'MMM d, yyyy')}
      </span>
      <span className='max-[479px]:hidden min-md:hidden' aria-hidden='true'>
        {format(date, 'MMMM d, yyyy')}
      </span>
      <span className='max-md:hidden'>{format(date, 'EEE MMMM d, yyyy')}</span>
    </>
  );
}

function variantsOf(variants: Variants, shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return variants;
}

function viewEnterOf(direction: number, shouldReduceMotion: boolean | null) {
  if (direction === 0) {
    return false;
  }
  if (shouldReduceMotion) {
    return { opacity: 0 };
  }
  const offset = direction * VIEW_SHIFT_PX;
  return { opacity: 0, x: offset };
}

function snapToQuarterHour(time: Date) {
  const snapped = new Date(time);
  const minutes = snapped.getMinutes();
  const remainder = minutes % 15;
  if (remainder === 0) {
    return snapped;
  }
  const isCloserToPrevious = remainder < 7.5;
  if (isCloserToPrevious) {
    snapped.setMinutes(minutes - remainder, 0, 0);
    return snapped;
  }
  snapped.setMinutes(minutes + 15 - remainder, 0, 0);
  return snapped;
}

function newEventId() {
  return Math.random().toString(36).substring(2, 11);
}

function announce(event: CalendarEvent, outcome: string) {
  toast(`Event "${event.title}" ${outcome}`, {
    description: format(new Date(event.start), 'MMM d, yyyy'),
    position: 'bottom-left',
  });
}

function ViewLabel({ label }: { label: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <span className='relative flex'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={label}
          variants={variantsOf(LABEL_VARIANTS, shouldReduceMotion)}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function EventCalendar({
  events = [],
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  className,
  initialView = 'month',
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>(initialView);
  const [slideDirection, setSlideDirection] = useState(0);
  const [dialog, setDialog] = useState<DialogState>(IDLE_DIALOG);
  const shouldReduceMotion = useReducedMotion();
  const periodKey = periodKeyOf(currentDate, view);
  const viewLabel = VIEW_OPTIONS.find((option) => option.view === view)?.label;
  const viewInitial = view.charAt(0).toUpperCase();

  useEffect(() => {
    if (dialog.isOpen) {
      return;
    }
    function switchViewFromKeyboard(keyEvent: KeyboardEvent) {
      if (isTypingTarget(keyEvent.target)) {
        return;
      }
      if (hasModifierKey(keyEvent)) {
        return;
      }
      const nextView = SHORTCUT_VIEWS[keyEvent.key.toLowerCase()];
      if (!nextView) {
        return;
      }
      setView(nextView);
      setSlideDirection(0);
    }
    window.addEventListener('keydown', switchViewFromKeyboard);
    return () => window.removeEventListener('keydown', switchViewFromKeyboard);
  }, [dialog.isOpen]);

  function changeView(nextView: CalendarView) {
    setView(nextView);
    setSlideDirection(0);
  }

  function navigate(step: number) {
    setCurrentDate((date) => shiftDate(date, view, step));
    setSlideDirection(step);
  }

  function goToToday() {
    const today = new Date();
    const direction = Math.sign(today.getTime() - currentDate.getTime());
    setCurrentDate(today);
    setSlideDirection(direction);
  }

  function openDialog(event: CalendarEvent | null) {
    setDialog((current) => ({
      isOpen: true,
      event,
      session: current.session + 1,
    }));
  }

  function closeDialog() {
    setDialog((current) => ({ ...current, isOpen: false }));
  }

  function handleEventCreate(startTime: Date) {
    const start = snapToQuarterHour(startTime);
    openDialog({
      id: '',
      title: '',
      start,
      end: addHours(start, 1),
      allDay: false,
    });
  }

  function handleEventSave(event: CalendarEvent) {
    if (event.id) {
      onEventUpdate?.(event);
      announce(event, 'updated');
    } else {
      onEventAdd?.({ ...event, id: newEventId() });
      announce(event, 'added');
    }
    closeDialog();
  }

  function handleEventDelete(eventId: string) {
    const deletedEvent = events.find((event) => event.id === eventId);
    onEventDelete?.(eventId);
    closeDialog();
    if (deletedEvent) {
      announce(deletedEvent, 'deleted');
    }
  }

  function handleEventMove(movedEvent: CalendarEvent) {
    onEventUpdate?.(movedEvent);
    announce(movedEvent, 'moved');
  }

  const viewProps = {
    currentDate,
    events,
    onEventSelect: openDialog,
    onEventCreate: handleEventCreate,
  };

  return (
    <div
      className='bg-card hairline-ring ring-border flex flex-col rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] has-data-[slot=month-view]:flex-1'
      style={
        {
          '--event-height': `${EventHeight}px`,
          '--event-gap': `${EventGap}px`,
          '--week-cells-height': `${WeekCellsHeight}px`,
        } as React.CSSProperties
      }
    >
      <CalendarDndProvider onEventUpdate={handleEventMove}>
        <div
          className={cn(
            'flex items-center justify-between p-2 sm:p-4',
            className
          )}
        >
          <div className='flex items-center gap-1 sm:gap-4'>
            <Button
              variant='outline'
              className='max-[479px]:aspect-square max-[479px]:p-0!'
              onClick={goToToday}
            >
              <CalendarCheckIcon className='min-[480px]:hidden' />
              <span className='max-[479px]:sr-only'>Today</span>
            </Button>
            <div className='flex items-center sm:gap-2'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => navigate(-1)}
                aria-label='Previous period'
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => navigate(1)}
                aria-label='Next period'
              >
                <ChevronRightIcon />
              </Button>
            </div>
            <h2 className='relative flex overflow-hidden text-sm font-semibold sm:text-lg'>
              <AnimatePresence
                mode='popLayout'
                initial={false}
                custom={slideDirection}
              >
                <motion.span
                  key={`${view}-${periodKey}`}
                  className='whitespace-nowrap'
                  custom={slideDirection}
                  variants={variantsOf(TITLE_VARIANTS, shouldReduceMotion)}
                  initial='enter'
                  animate='visible'
                  exit='exit'
                  transition={VIEW_TRANSITION}
                >
                  <ViewTitle date={currentDate} view={view} />
                </motion.span>
              </AnimatePresence>
            </h2>
          </div>
          <div className='flex items-center gap-2'>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant='outline'
                    className='gap-1.5 max-[479px]:h-8'
                  />
                }
              >
                <span className='min-[480px]:hidden' aria-hidden='true'>
                  {viewInitial}
                </span>
                <span className='max-[479px]:sr-only'>
                  <ViewLabel label={viewLabel ?? ''} />
                </span>
                <ChevronDownIcon className='-me-1 opacity-60' />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='min-w-32'>
                {VIEW_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.view}
                    onClick={() => changeView(option.view)}
                  >
                    {option.label}
                    <DropdownMenuShortcut>
                      <Kbd>{option.shortcut}</Kbd>
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              className='max-[479px]:aspect-square max-[479px]:p-0!'
              size='sm'
              onClick={() => openDialog(null)}
            >
              <PlusIcon className='opacity-60 sm:-ms-1' />
              <span className='max-sm:sr-only'>New event</span>
            </Button>
          </div>
        </div>

        <motion.div
          key={`${view}-${periodKey}`}
          className='flex flex-1 flex-col'
          initial={viewEnterOf(slideDirection, shouldReduceMotion)}
          animate={VIEW_AT_REST}
          transition={VIEW_TRANSITION}
        >
          {view === 'month' && <MonthView {...viewProps} />}
          {view === 'week' && <WeekView {...viewProps} />}
          {view === 'day' && <DayView {...viewProps} />}
          {view === 'agenda' && (
            <AgendaView
              currentDate={currentDate}
              events={events}
              onEventSelect={openDialog}
            />
          )}
        </motion.div>

        <EventDialog
          event={dialog.event}
          isOpen={dialog.isOpen}
          session={dialog.session}
          onClose={closeDialog}
          onSave={handleEventSave}
          onDelete={handleEventDelete}
        />
      </CalendarDndProvider>
    </div>
  );
}
