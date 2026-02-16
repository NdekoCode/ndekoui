'use client';

import { useDroppable } from '@dnd-kit/core';

import { cn } from '@/registry/ndeko/lib/utils';

import { useCalendarDnd } from './calendar-dnd-context';

type DroppableCellProps = {
  id: string;
  date: Date;
  /** Hours of the slot in the week and day views: 9.25 is 9:15. */
  time?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
};

export function DroppableCell({
  id,
  date,
  time,
  children,
  className,
  style,
  onClick,
}: DroppableCellProps) {
  const { activeEvent } = useCalendarDnd();
  const { setNodeRef, isOver } = useDroppable({ id, data: { date, time } });
  const isDropTarget = isOver && Boolean(activeEvent);

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      style={style}
      className={cn(
        'data-dragging:bg-primary/[0.06] flex h-full flex-col overflow-hidden px-0.5 py-1 transition-colors duration-150 sm:px-1',
        className
      )}
      data-dragging={isDropTarget || undefined}
    >
      {children}
    </div>
  );
}
