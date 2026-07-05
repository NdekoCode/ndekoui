'use client';

import {
  animate,
  motion,
  type MotionValue,
  type Transition,
  useMotionValue,
} from 'motion/react';
import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

export type SwapGridItem = {
  id: string;
  label: string;
  content: React.ReactNode;
};

export type SwapGridSlots = (string | null)[];

type TileHandle = {
  element: HTMLElement;
  x: MotionValue<number>;
  y: MotionValue<number>;
};

type FlipStart = {
  left: number;
  top: number;
  velocityX: number;
  velocityY: number;
};

type DragSession = {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  originSlot: number;
  isActive: boolean;
};

type Grab = {
  id: string;
  originSlots: SwapGridSlots;
};

type Step = { rows: number; columns: number };

const SETTLE: Transition = { type: 'spring', bounce: 0, duration: 0.4 };

const DRAG_THRESHOLD = 4;

const STEPS: Record<string, Step> = {
  ArrowUp: { rows: -1, columns: 0 },
  ArrowDown: { rows: 1, columns: 0 },
  ArrowLeft: { rows: 0, columns: -1 },
  ArrowRight: { rows: 0, columns: 1 },
};

const CONTROLS = 'button, a, input, select, textarea, [contenteditable="true"]';

function placementOf(index: number, columns: number): React.CSSProperties {
  const column = index % columns;
  const row = Math.floor(index / columns);
  return { gridColumn: column + 1, gridRow: row + 1 };
}

function positionOf(index: number, columns: number) {
  const column = index % columns;
  const row = Math.floor(index / columns);
  return `row ${row + 1}, column ${column + 1}`;
}

function neighbourOf(
  index: number,
  step: Step,
  columns: number,
  slotCount: number
) {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const nextColumn = column + step.columns;
  const nextRow = row + step.rows;
  const isInsideRow = nextColumn >= 0 && nextColumn < columns;
  const rowStart = nextRow * columns;
  const nextIndex = rowStart + nextColumn;
  const isInsideGrid = nextRow >= 0 && nextIndex < slotCount;
  if (!isInsideRow) {
    return null;
  }
  if (!isInsideGrid) {
    return null;
  }
  return nextIndex;
}

function swappedSlots(slots: SwapGridSlots, from: number, to: number) {
  const next = [...slots];
  const moving = next[from];
  next[from] = next[to];
  next[to] = moving;
  return next;
}

function presentIds(ids: (string | null)[]) {
  return ids.filter((id): id is string => id !== null);
}

function changedIds(before: SwapGridSlots, after: SwapGridSlots) {
  const moved = after.filter((id, index) => id !== before[index]);
  return presentIds(moved);
}

function startsOnControl(event: React.PointerEvent<HTMLElement>) {
  const target = event.target as HTMLElement;
  const control = target.closest(CONTROLS);
  if (!control) {
    return false;
  }
  return event.currentTarget.contains(control);
}

function isPrimaryPress(event: React.PointerEvent) {
  return event.button === 0;
}

function isActivationKey(event: React.KeyboardEvent) {
  return event.key === 'Enter' || event.key === ' ';
}

function initialSlotsOf(
  items: SwapGridItem[],
  defaultSlots: SwapGridSlots | undefined
) {
  if (defaultSlots) {
    return defaultSlots;
  }
  return items.map((item) => item.id);
}

export type SwapGridProps = {
  items: SwapGridItem[];
  columns?: number;
  defaultSlots?: SwapGridSlots;
  onSlotsChange?: (slots: SwapGridSlots) => void;
  className?: string;
  itemClassName?: string;
  'aria-label'?: string;
};

export function SwapGrid({
  items,
  columns = 3,
  defaultSlots,
  onSlotsChange,
  className,
  itemClassName,
  'aria-label': ariaLabel,
}: SwapGridProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [slots, setSlots] = useState(() => initialSlotsOf(items, defaultSlots));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [targetSlot, setTargetSlot] = useState<number | null>(null);
  const [grab, setGrab] = useState<Grab | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const tiles = useRef(new Map<string, TileHandle>());
  const slotElements = useRef(new Map<number, HTMLElement>());
  const flipStarts = useRef<Map<string, FlipStart> | null>(null);
  const drag = useRef<DragSession | null>(null);
  const hintId = useId();
  const labels = new Map(items.map((item) => [item.id, item.label]));
  const contents = new Map(items.map((item) => [item.id, item.content]));

  useLayoutEffect(() => {
    const starts = flipStarts.current;
    flipStarts.current = null;
    if (!starts) {
      return;
    }
    starts.forEach((start, id) => {
      const tile = tiles.current.get(id);
      if (!tile) {
        return;
      }
      if (prefersReducedMotion) {
        tile.x.jump(0);
        tile.y.jump(0);
        return;
      }
      const deltaX = start.left - tile.element.offsetLeft;
      const deltaY = start.top - tile.element.offsetTop;
      tile.x.jump(deltaX);
      tile.y.jump(deltaY);
      animate(tile.x, 0, { ...SETTLE, velocity: start.velocityX });
      animate(tile.y, 0, { ...SETTLE, velocity: start.velocityY });
    });
  }, [slots, prefersReducedMotion]);

  const registerTile = useCallback((id: string, handle: TileHandle) => {
    tiles.current.set(id, handle);
    return () => {
      tiles.current.delete(id);
    };
  }, []);

  function registerSlot(index: number, element: HTMLElement | null) {
    if (!element) {
      slotElements.current.delete(index);
      return;
    }
    slotElements.current.set(index, element);
  }

  function labelOf(id: string | null) {
    if (id === null) {
      return '';
    }
    return labels.get(id) ?? id;
  }

  function rememberPositions(ids: string[]) {
    const starts = new Map<string, FlipStart>();
    for (const id of ids) {
      const tile = tiles.current.get(id);
      if (!tile) {
        continue;
      }
      const left = tile.element.offsetLeft + tile.x.get();
      const top = tile.element.offsetTop + tile.y.get();
      const velocityX = tile.x.getVelocity();
      const velocityY = tile.y.getVelocity();
      starts.set(id, { left, top, velocityX, velocityY });
    }
    return starts;
  }

  function commitSlots(next: SwapGridSlots) {
    const moved = changedIds(slots, next);
    flipStarts.current = rememberPositions(moved);
    setSlots(next);
    onSlotsChange?.(next);
  }

  function swapMessage(id: string, from: number, to: number) {
    const label = labelOf(id);
    const position = positionOf(to, columns);
    const displaced = slots[to];
    if (displaced === null) {
      return `${label} moved to ${position}`;
    }
    const displacedLabel = labelOf(displaced);
    const displacedPosition = positionOf(from, columns);
    return `${label} swapped with ${displacedLabel}. ${label} is in ${position}, ${displacedLabel} in ${displacedPosition}`;
  }

  function swap(id: string, from: number, to: number) {
    const message = swapMessage(id, from, to);
    const next = swappedSlots(slots, from, to);
    setAnnouncement(message);
    commitSlots(next);
  }

  function slotAt(clientX: number, clientY: number) {
    for (const [index, element] of slotElements.current) {
      const box = element.getBoundingClientRect();
      const isInsideX = clientX >= box.left && clientX <= box.right;
      const isInsideY = clientY >= box.top && clientY <= box.bottom;
      if (isInsideX && isInsideY) {
        return index;
      }
    }
    return null;
  }

  function returnHome(id: string) {
    const tile = tiles.current.get(id);
    if (!tile) {
      return;
    }
    if (prefersReducedMotion) {
      tile.x.jump(0);
      tile.y.jump(0);
      return;
    }
    animate(tile.x, 0, SETTLE);
    animate(tile.y, 0, SETTLE);
  }

  function pressTile(id: string, event: React.PointerEvent<HTMLElement>) {
    if (drag.current) {
      return;
    }
    if (!isPrimaryPress(event)) {
      return;
    }
    if (startsOnControl(event)) {
      return;
    }
    const tile = tiles.current.get(id);
    if (!tile) {
      return;
    }
    drag.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: tile.x.get(),
      originY: tile.y.get(),
      originSlot: slots.indexOf(id),
      isActive: false,
    };
  }

  function activateDrag(
    session: DragSession,
    tile: TileHandle,
    event: React.PointerEvent<HTMLElement>
  ) {
    session.isActive = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    tile.x.stop();
    tile.y.stop();
    window.getSelection()?.removeAllRanges();
    setDraggingId(session.id);
  }

  function moveTile(event: React.PointerEvent<HTMLElement>) {
    const session = drag.current;
    if (!session) {
      return;
    }
    if (event.pointerId !== session.pointerId) {
      return;
    }
    const tile = tiles.current.get(session.id);
    if (!tile) {
      return;
    }
    const deltaX = event.clientX - session.startX;
    const deltaY = event.clientY - session.startY;
    const distance = Math.hypot(deltaX, deltaY);
    const isStillAPress = !session.isActive && distance < DRAG_THRESHOLD;
    if (isStillAPress) {
      return;
    }
    if (!session.isActive) {
      activateDrag(session, tile, event);
    }
    tile.x.set(session.originX + deltaX);
    tile.y.set(session.originY + deltaY);
    const target = slotAt(event.clientX, event.clientY);
    setTargetSlot(target);
  }

  function endDrag(event: React.PointerEvent<HTMLElement>, canDrop: boolean) {
    const session = drag.current;
    if (!session) {
      return;
    }
    if (event.pointerId !== session.pointerId) {
      return;
    }
    drag.current = null;
    if (!session.isActive) {
      return;
    }
    setDraggingId(null);
    setTargetSlot(null);
    const target = slotAt(event.clientX, event.clientY);
    const isOtherSlot = target !== session.originSlot;
    const isDrop = canDrop && isOtherSlot;
    if (target === null || !isDrop) {
      returnHome(session.id);
      return;
    }
    swap(session.id, session.originSlot, target);
  }

  function releaseTile(event: React.PointerEvent<HTMLElement>) {
    endDrag(event, true);
  }

  function cancelDrag(event: React.PointerEvent<HTMLElement>) {
    endDrag(event, false);
  }

  function pickUp(id: string) {
    const slot = slots.indexOf(id);
    const position = positionOf(slot, columns);
    const label = labelOf(id);
    setGrab({ id, originSlots: slots });
    setAnnouncement(
      `${label} picked up in ${position}. Use the arrow keys to move it, Enter to drop it, Escape to cancel`
    );
  }

  function drop(id: string) {
    const slot = slots.indexOf(id);
    const position = positionOf(slot, columns);
    const label = labelOf(id);
    setGrab(null);
    setAnnouncement(`${label} dropped in ${position}`);
  }

  function cancelGrab(current: Grab) {
    const slot = current.originSlots.indexOf(current.id);
    const position = positionOf(slot, columns);
    const label = labelOf(current.id);
    setGrab(null);
    setAnnouncement(`Move cancelled. ${label} is back in ${position}`);
    commitSlots(current.originSlots);
  }

  function moveGrabbed(id: string, step: Step) {
    const from = slots.indexOf(id);
    const to = neighbourOf(from, step, columns, slots.length);
    if (to === null) {
      return;
    }
    swap(id, from, to);
  }

  function handleKeyDown(id: string, event: React.KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) {
      return;
    }
    const isGrabbed = grab?.id === id;
    if (isActivationKey(event)) {
      event.preventDefault();
      if (event.repeat) {
        return;
      }
      if (isGrabbed) {
        drop(id);
        return;
      }
      pickUp(id);
      return;
    }
    if (!grab) {
      return;
    }
    if (!isGrabbed) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelGrab(grab);
      return;
    }
    const step = STEPS[event.key];
    if (!step) {
      return;
    }
    event.preventDefault();
    moveGrabbed(id, step);
  }

  function handleBlur(id: string) {
    if (grab?.id !== id) {
      return;
    }
    drop(id);
  }

  function isDropTargetOf(id: string, index: number) {
    if (draggingId === null) {
      return false;
    }
    if (draggingId === id) {
      return false;
    }
    return targetSlot === index;
  }

  const gridStyle = {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
  };

  return (
    <>
      <div
        role='group'
        aria-label={ariaLabel}
        className={cn('relative grid gap-3', className)}
        style={gridStyle}
      >
        {slots.map((id, index) => (
          <SwapSlot
            key={`slot-${index}`}
            index={index}
            columns={columns}
            isEmpty={id === null}
            isTarget={targetSlot === index}
            register={registerSlot}
          />
        ))}
        {slots.map((id, index) => {
          if (id === null) {
            return null;
          }
          return (
            <SwapTile
              key={id}
              id={id}
              label={labelOf(id)}
              slotIndex={index}
              columns={columns}
              hintId={hintId}
              isDragging={draggingId === id}
              isDropTarget={isDropTargetOf(id, index)}
              isGrabbed={grab?.id === id}
              className={itemClassName}
              register={registerTile}
              onPress={pressTile}
              onMove={moveTile}
              onRelease={releaseTile}
              onCancel={cancelDrag}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
            >
              {contents.get(id)}
            </SwapTile>
          );
        })}
      </div>
      <p id={hintId} className='sr-only'>
        Press Enter or Space to pick up an item, the arrow keys to swap it with
        its neighbour, Enter to drop it and Escape to cancel.
      </p>
      <p aria-live='polite' className='sr-only'>
        {announcement}
      </p>
    </>
  );
}

const SLOT = [
  'hairline-border rounded-xl border-dashed border-transparent',
  'transition-colors duration-150 ease-(--ease-out-strong)',
  'data-[empty=true]:border-foreground/15',
  'data-[target=true]:border-primary/50 data-[target=true]:bg-primary/[0.06]',
].join(' ');

type SwapSlotProps = {
  index: number;
  columns: number;
  isEmpty: boolean;
  isTarget: boolean;
  register: (index: number, element: HTMLElement | null) => void;
};

function SwapSlot({
  index,
  columns,
  isEmpty,
  isTarget,
  register,
}: SwapSlotProps) {
  function attach(element: HTMLDivElement | null) {
    register(index, element);
  }

  return (
    <div
      ref={attach}
      aria-hidden='true'
      data-empty={isEmpty}
      data-target={isTarget}
      className={SLOT}
      style={placementOf(index, columns)}
    />
  );
}

const TILE = [
  'group/tile relative z-10 cursor-grab touch-none rounded-xl outline-none select-none',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
  'data-[dragging=true]:z-30 data-[dragging=true]:cursor-grabbing',
  'data-[grabbed=true]:z-20',
].join(' ');

const TILE_SURFACE = [
  'size-full rounded-xl bg-card text-card-foreground',
  'hairline-ring ring-border shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
  'transition-[scale,box-shadow] duration-150 ease-(--ease-out-strong)',
  'motion-safe:group-data-[dragging=true]/tile:scale-[1.03] motion-safe:group-data-[grabbed=true]/tile:scale-[1.03]',
  'group-data-[dragging=true]/tile:shadow-[0_12px_32px_-8px_rgb(0_0_0/0.18)]',
  'group-data-[grabbed=true]/tile:ring-primary/60 group-data-[target=true]/tile:ring-primary/60',
].join(' ');

type SwapTileProps = {
  id: string;
  label: string;
  slotIndex: number;
  columns: number;
  hintId: string;
  isDragging: boolean;
  isDropTarget: boolean;
  isGrabbed: boolean;
  className?: string;
  register: (id: string, handle: TileHandle) => () => void;
  onPress: (id: string, event: React.PointerEvent<HTMLElement>) => void;
  onMove: (event: React.PointerEvent<HTMLElement>) => void;
  onRelease: (event: React.PointerEvent<HTMLElement>) => void;
  onCancel: (event: React.PointerEvent<HTMLElement>) => void;
  onKeyDown: (id: string, event: React.KeyboardEvent<HTMLElement>) => void;
  onBlur: (id: string) => void;
  children: React.ReactNode;
};

function SwapTile({
  id,
  label,
  slotIndex,
  columns,
  hintId,
  isDragging,
  isDropTarget,
  isGrabbed,
  className,
  register,
  onPress,
  onMove,
  onRelease,
  onCancel,
  onKeyDown,
  onBlur,
  children,
}: SwapTileProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element) {
        return;
      }
      return register(id, { element, x, y });
    },
    [id, register, x, y]
  );

  function press(event: React.PointerEvent<HTMLDivElement>) {
    onPress(id, event);
  }

  function keyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    onKeyDown(id, event);
  }

  function blur() {
    onBlur(id);
  }

  return (
    <motion.div
      ref={attach}
      role='button'
      tabIndex={0}
      aria-roledescription='swappable item'
      aria-label={`${label}, ${positionOf(slotIndex, columns)}`}
      aria-describedby={hintId}
      aria-pressed={isGrabbed}
      data-dragging={isDragging}
      data-grabbed={isGrabbed}
      data-target={isDropTarget}
      className={TILE}
      style={{ ...placementOf(slotIndex, columns), x, y }}
      onPointerDown={press}
      onPointerMove={onMove}
      onPointerUp={onRelease}
      onPointerCancel={onCancel}
      onKeyDown={keyDown}
      onBlur={blur}
    >
      <div className={cn(TILE_SURFACE, className)}>{children}</div>
    </motion.div>
  );
}
