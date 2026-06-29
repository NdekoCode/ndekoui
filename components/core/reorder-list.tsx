'use client';

import {
  Reorder,
  type Transition,
  useDragControls,
  useReducedMotion,
} from 'motion/react';
import { useId, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  GripVerticalIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const SETTLE: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

const INSTANT: Transition = { duration: 0 };

const LIFT = { scale: 1.02 };

const ROW = [
  'relative flex items-center gap-1 rounded-xl bg-card p-1.5 text-card-foreground',
  'hairline-ring ring-border shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
].join(' ');

const HANDLE = [
  'grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground',
  'transition-colors hover:bg-foreground/5 hover:text-foreground active:cursor-grabbing',
].join(' ');

function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function settleOf(prefersReducedMotion: boolean | null) {
  if (prefersReducedMotion) {
    return INSTANT;
  }
  return SETTLE;
}

function liftOf(prefersReducedMotion: boolean | null) {
  if (prefersReducedMotion) {
    return undefined;
  }
  return LIFT;
}

function positionMessage(label: string, index: number, count: number) {
  const position = index + 1;
  return `${label} moved to position ${position} of ${count}`;
}

type ReorderRowProps<T> = {
  item: T;
  index: number;
  count: number;
  label: string;
  hintId: string;
  groupRef: React.RefObject<HTMLUListElement | null>;
  onMove: (from: number, to: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  children: React.ReactNode;
};

function ReorderRow<T>({
  item,
  index,
  count,
  label,
  hintId,
  groupRef,
  onMove,
  onDragStart,
  onDragEnd,
  children,
}: ReorderRowProps<T>) {
  const prefersReducedMotion = useReducedMotion();
  const controls = useDragControls();
  const isFirst = index === 0;
  const lastIndex = count - 1;
  const isLast = index === lastIndex;

  function startDrag(event: React.PointerEvent) {
    onDragStart();
    controls.start(event);
  }

  function moveUp() {
    onMove(index, index - 1);
  }

  function moveDown() {
    onMove(index, index + 1);
  }

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      dragConstraints={groupRef}
      dragElastic={0.08}
      onDragEnd={onDragEnd}
      whileDrag={liftOf(prefersReducedMotion)}
      transition={settleOf(prefersReducedMotion)}
      aria-describedby={hintId}
      className={ROW}
    >
      <span aria-hidden='true' className={HANDLE} onPointerDown={startDrag}>
        <GripVerticalIcon className='size-4' />
      </span>
      <div className='min-w-0 flex-1 px-1'>{children}</div>
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        className='text-muted-foreground'
        aria-label={`Move ${label} up`}
        disabled={isFirst}
        focusableWhenDisabled
        onClick={moveUp}
      >
        <ChevronUpIcon />
      </Button>
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        className='text-muted-foreground'
        aria-label={`Move ${label} down`}
        disabled={isLast}
        focusableWhenDisabled
        onClick={moveDown}
      >
        <ChevronDownIcon />
      </Button>
    </Reorder.Item>
  );
}

export type ReorderListProps<T> = {
  items: T[];
  onReorder: (items: T[]) => void;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  className?: string;
  'aria-label'?: string;
};

export function ReorderList<T>({
  items,
  onReorder,
  getKey,
  getLabel,
  renderItem,
  className,
  'aria-label': ariaLabel,
}: ReorderListProps<T>) {
  const groupRef = useRef<HTMLUListElement>(null);
  const isPointerDragging = useRef(false);
  const draggedItem = useRef<T | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const hintId = useId();
  const count = items.length;

  function announce(item: T, nextItems: T[]) {
    const index = nextItems.indexOf(item);
    const label = getLabel(item);
    const message = positionMessage(label, index, count);
    setAnnouncement(message);
  }

  function reorderFromGroup(nextItems: T[], moved: T) {
    onReorder(nextItems);
    draggedItem.current = moved;
    if (isPointerDragging.current) {
      return;
    }
    announce(moved, nextItems);
  }

  function moveByButton(from: number, to: number) {
    const moved = items[from];
    const nextItems = moveItem(items, from, to);
    onReorder(nextItems);
    announce(moved, nextItems);
  }

  function beginPointerDrag() {
    isPointerDragging.current = true;
    draggedItem.current = null;
  }

  function endPointerDrag() {
    isPointerDragging.current = false;
    const moved = draggedItem.current;
    if (moved === null) {
      return;
    }
    announce(moved, items);
  }

  return (
    <>
      <Reorder.Group
        ref={groupRef}
        axis='y'
        values={items}
        onReorder={reorderFromGroup}
        aria-label={ariaLabel}
        className={cn('flex flex-col gap-2', className)}
      >
        {items.map((item, index) => (
          <ReorderRow
            key={getKey(item)}
            item={item}
            index={index}
            count={count}
            label={getLabel(item)}
            hintId={hintId}
            groupRef={groupRef}
            onMove={moveByButton}
            onDragStart={beginPointerDrag}
            onDragEnd={endPointerDrag}
          >
            {renderItem(item)}
          </ReorderRow>
        ))}
      </Reorder.Group>
      <p id={hintId} className='sr-only'>
        Drag the handle, use the move buttons, or press Space to pick up the
        row, the arrow keys to move it and Space to drop it.
      </p>
      <p aria-live='polite' className='sr-only'>
        {announcement}
      </p>
    </>
  );
}
