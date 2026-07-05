'use client';

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  addMinutes,
  differenceInMinutes,
  isSameDay,
  isSameMinute,
} from 'date-fns';
import { motion, type Transition } from 'motion/react';
import { createContext, useContext, useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

import { EventItem } from './event-item';
import type { CalendarEvent, TimedView } from './types';

export const DROP_SPRING: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.35,
};

type DragState = {
  activeEvent: CalendarEvent | null;
  activeId: UniqueIdentifier | null;
  activeView: TimedView | null;
  currentTime: Date | null;
  eventHeight: number | null;
};

type CalendarDndContextValue = DragState & {
  droppedEventId: string | null;
  clearDroppedEvent: () => void;
};

type ActiveData = {
  event: CalendarEvent;
  view: TimedView;
  height?: number | null;
};

type OverData = { date: Date; time?: number };

const IDLE_DRAG: DragState = {
  activeEvent: null,
  activeId: null,
  activeView: null,
  currentTime: null,
  eventHeight: null,
};

const CalendarDndContext = createContext<CalendarDndContextValue>({
  ...IDLE_DRAG,
  droppedEventId: null,
  clearDroppedEvent: () => undefined,
});

export function useCalendarDnd() {
  return useContext(CalendarDndContext);
}

/** The minutes of a slot, rounded to the closest quarter hour. */
function quarterMinutesOf(fractionalHour: number) {
  if (fractionalHour < 0.125) {
    return 0;
  }
  if (fractionalHour < 0.375) {
    return 15;
  }
  if (fractionalHour < 0.625) {
    return 30;
  }
  return 45;
}

function slotTimeOf(date: Date, time: number) {
  const slotTime = new Date(date);
  const hours = Math.floor(time);
  const minutes = quarterMinutesOf(time - hours);
  slotTime.setHours(hours, minutes, 0, 0);
  return slotTime;
}

function sameTimeOnDay(date: Date, time: Date) {
  const moved = new Date(date);
  moved.setHours(
    time.getHours(),
    time.getMinutes(),
    time.getSeconds(),
    time.getMilliseconds()
  );
  return moved;
}

function overlayHeightOf(eventHeight: number | null) {
  if (eventHeight) {
    return `${eventHeight}px`;
  }
  return 'auto';
}

function overlayLayoutIdOf(
  event: CalendarEvent,
  shouldReduceMotion: boolean | null
) {
  if (shouldReduceMotion) {
    return undefined;
  }
  return `dropped-event-${event.id}`;
}

function DragPreview({ drag }: { drag: DragState }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const { activeEvent, activeView } = drag;
  if (!activeEvent || !activeView) {
    return null;
  }

  return (
    <motion.div
      layoutId={overlayLayoutIdOf(activeEvent, shouldReduceMotion)}
      transition={DROP_SPRING}
      style={{ height: overlayHeightOf(drag.eventHeight) }}
    >
      <EventItem
        event={activeEvent}
        view={activeView}
        isDragging
        showTime={activeView !== 'month'}
        currentTime={drag.currentTime ?? undefined}
      />
    </motion.div>
  );
}

type CalendarDndProviderProps = {
  children: React.ReactNode;
  onEventUpdate: (event: CalendarEvent) => void;
};

export function CalendarDndProvider({
  children,
  onEventUpdate,
}: CalendarDndProviderProps) {
  const [drag, setDrag] = useState<DragState>(IDLE_DRAG);
  const [droppedEventId, setDroppedEventId] = useState<string | null>(null);
  const dndContextId = useId();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function clearDroppedEvent() {
    setDroppedEventId(null);
  }

  function handleDragStart({ active }: DragStartEvent) {
    const data = active.data.current as ActiveData | undefined;
    if (!data) {
      return;
    }
    setDrag({
      activeEvent: data.event,
      activeId: active.id,
      activeView: data.view,
      currentTime: new Date(data.event.start),
      eventHeight: data.height ?? null,
    });
  }

  function handleDragOver({ over }: DragOverEvent) {
    const overData = over?.data.current as OverData | undefined;
    if (!overData) {
      return;
    }
    if (!drag.activeEvent) {
      return;
    }
    const isTimeSlot = overData.time !== undefined;
    const isTimeGrid = drag.activeView !== 'month';
    const currentTime = drag.currentTime;

    if (isTimeSlot && isTimeGrid) {
      const slotTime = slotTimeOf(overData.date, overData.time ?? 0);
      const hasMoved = !currentTime || !isSameMinute(slotTime, currentTime);
      if (hasMoved) {
        setDrag((state) => ({ ...state, currentTime: slotTime }));
      }
      return;
    }

    if (drag.activeView !== 'month') {
      return;
    }
    let dayTime = new Date(overData.date);
    if (currentTime) {
      dayTime = sameTimeOnDay(overData.date, currentTime);
    }
    const hasChangedDay = !currentTime || !isSameDay(dayTime, currentTime);
    if (hasChangedDay) {
      setDrag((state) => ({ ...state, currentTime: dayTime }));
    }
  }

  function moveEvent(
    over: NonNullable<DragEndEvent['over']>,
    currentTime: Date
  ) {
    const activeEvent = drag.activeEvent;
    const overData = over.data.current as OverData | undefined;
    if (!activeEvent) {
      return;
    }
    if (!overData?.date) {
      return;
    }

    let newStart = sameTimeOnDay(overData.date, currentTime);
    if (overData.time !== undefined) {
      newStart = slotTimeOf(overData.date, overData.time);
    }
    const originalStart = new Date(activeEvent.start);
    const originalEnd = new Date(activeEvent.end);
    const durationMinutes = differenceInMinutes(originalEnd, originalStart);
    const newEnd = addMinutes(newStart, durationMinutes);
    const hasStartTimeChanged = !isSameMinute(originalStart, newStart);

    if (hasStartTimeChanged) {
      onEventUpdate({ ...activeEvent, start: newStart, end: newEnd });
      setDroppedEventId(activeEvent.id);
    }
  }

  function handleDragEnd({ over }: DragEndEvent) {
    const currentTime = drag.currentTime;
    setDrag(IDLE_DRAG);
    if (!over) {
      return;
    }
    if (!currentTime) {
      return;
    }
    moveEvent(over, currentTime);
  }

  const contextValue: CalendarDndContextValue = {
    ...drag,
    droppedEventId,
    clearDroppedEvent,
  };

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDrag(IDLE_DRAG)}
    >
      <CalendarDndContext.Provider value={contextValue}>
        {children}

        <DragOverlay adjustScale={false} dropAnimation={null}>
          <DragPreview drag={drag} />
        </DragOverlay>
      </CalendarDndContext.Provider>
    </DndContext>
  );
}
