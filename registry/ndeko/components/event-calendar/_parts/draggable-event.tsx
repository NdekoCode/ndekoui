'use client';

import { useDraggable } from '@dnd-kit/core';
import { motion } from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

import { DROP_SPRING, useCalendarDnd } from './calendar-dnd-context';
import { EventItem } from './event-item';
import type { CalendarEvent, TimedView } from './types';

type DraggableEventProps = {
  event: CalendarEvent;
  view: TimedView;
  showTime?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  height?: number;
  isFirstDay?: boolean;
  isLastDay?: boolean;
};

function heightStyleOf(height: number | undefined) {
  if (height) {
    return height;
  }
  return 'auto';
}

export function DraggableEvent({
  event,
  view,
  showTime,
  onClick,
  height,
  isFirstDay = true,
  isLastDay = true,
}: DraggableEventProps) {
  const { activeId, droppedEventId, clearDroppedEvent } = useCalendarDnd();
  const shouldReduceMotion = usePrefersReducedMotion();
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const draggableId = `${event.id}-${view}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: draggableId,
    data: {
      event,
      view,
      height: height ?? measuredHeight,
    },
  });
  const isActive = isDragging || activeId === draggableId;
  const isJustDropped = droppedEventId === event.id;
  const hasDropAnimation = isJustDropped && !shouldReduceMotion;
  let layoutId: string | undefined;
  if (hasDropAnimation) {
    layoutId = `dropped-event-${event.id}`;
  }

  function measure(pointerEvent: React.PointerEvent<HTMLDivElement>) {
    setMeasuredHeight(pointerEvent.currentTarget.offsetHeight);
  }

  function settleDrop() {
    if (isJustDropped) {
      clearDroppedEvent();
    }
  }

  if (isActive) {
    return (
      <div
        ref={setNodeRef}
        className='opacity-0'
        style={{ height: heightStyleOf(height) }}
      />
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      layoutId={layoutId}
      transition={DROP_SPRING}
      onLayoutAnimationComplete={settleDrop}
      onPointerDownCapture={measure}
      style={{ height: heightStyleOf(height) }}
      className='touch-none'
    >
      <EventItem
        event={event}
        view={view}
        showTime={showTime}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        isDragging={isDragging}
        onClick={onClick}
        dndListeners={listeners}
        dndAttributes={attributes}
      />
    </motion.div>
  );
}
