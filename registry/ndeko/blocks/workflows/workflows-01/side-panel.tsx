'use client';

import { useRef } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

export const DEFAULT_WIDTH = 320;

const MIN_WIDTH = 264;

const MAX_WIDTH = 440;

const KEY_STEP = 16;

/** How far the sheet has to be pulled down before letting go closes it. */
const CLOSE_AFTER_PX = 72;

/** The share of the canvas the sheet covers, which the canvas keeps clear of the selected step. */
export const SHEET_SHARE = 0.58;

function bounded(width: number) {
  const atLeast = Math.max(MIN_WIDTH, width);
  return Math.min(MAX_WIDTH, atLeast);
}

/** The panel sits on the right, so moving the handle to the left widens it. */
function widthFromKey(key: string, width: number) {
  if (key === 'ArrowLeft') {
    return bounded(width + KEY_STEP);
  }
  if (key === 'ArrowRight') {
    return bounded(width - KEY_STEP);
  }
  if (key === 'Home') {
    return MAX_WIDTH;
  }
  if (key === 'End') {
    return MIN_WIDTH;
  }
  return null;
}

type ResizeHandleProps = {
  width: number;
  /** The element whose `--inspector` the handle drives. */
  containerRef: React.RefObject<HTMLElement | null>;
  onWidthChange: (width: number) => void;
};

/** While it is dragged the width is written to the container. React hears about it once, on release. */
export function ResizeHandle({
  width,
  containerRef,
  onWidthChange,
}: ResizeHandleProps) {
  const dragged = useRef<number | null>(null);

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragged.current = width;
  }

  function drag(event: React.PointerEvent<HTMLDivElement>) {
    const container = containerRef.current;
    const isDragging = dragged.current !== null;
    if (!container || !isDragging) {
      return;
    }
    const box = container.getBoundingClientRect();
    const next = bounded(box.right - event.clientX);
    dragged.current = next;
    container.style.setProperty('--inspector', `${next}px`);
  }

  function endDrag() {
    const next = dragged.current;
    dragged.current = null;
    if (next !== null) {
      onWidthChange(Math.round(next));
    }
  }

  function resizeWithKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const next = widthFromKey(event.key, width);
    if (next === null) {
      return;
    }
    event.preventDefault();
    onWidthChange(next);
  }

  return (
    <div
      role='separator'
      tabIndex={0}
      aria-orientation='vertical'
      aria-label='Resize the canvas and the inspector'
      aria-valuemin={MIN_WIDTH}
      aria-valuemax={MAX_WIDTH}
      aria-valuenow={width}
      onPointerDown={startDrag}
      onPointerMove={drag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={() => onWidthChange(DEFAULT_WIDTH)}
      onKeyDown={resizeWithKeys}
      className='group/handle focus-visible:ring-ring/25 flex w-3 shrink-0 cursor-col-resize touch-none items-center justify-center rounded-full outline-none focus-visible:ring-[3px]'
    >
      <span className='bg-foreground/15 group-hover/handle:bg-foreground/35 group-active/handle:bg-primary h-8 w-1 rounded-full transition-colors duration-150' />
    </div>
  );
}

function panelOf(isOpen: boolean) {
  if (isOpen) {
    return 'translate-y-0';
  }
  return 'translate-y-[calc(100%+1rem)]';
}

/**
 * Escape pressed in the panel itself. The list of a select opened from it is drawn elsewhere on the
 * page and closes on its own Escape, which still reaches the panel through React.
 */
export function isOwnEscape(event: React.KeyboardEvent<HTMLElement>) {
  const target = event.target;
  const isInside =
    target instanceof Node && event.currentTarget.contains(target);
  return isInside && event.key === 'Escape';
}

type BottomSheetProps = {
  id: string;
  isOpen: boolean;
  label: string;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * Drawn inside the block, over the lower part of the canvas, which stays in use above it. Its grip
 * follows the finger and closes the sheet when it is pulled far enough.
 */
export function BottomSheet({
  id,
  isOpen,
  label,
  onClose,
  children,
}: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const pulled = useRef(0);

  function startPull(event: React.PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    startY.current = event.clientY;
    pulled.current = 0;
  }

  function pull(event: React.PointerEvent<HTMLButtonElement>) {
    const panel = panelRef.current;
    const origin = startY.current;
    if (!panel || origin === null) {
      return;
    }
    const distance = Math.max(0, event.clientY - origin);
    pulled.current = distance;
    panel.style.transition = 'none';
    panel.style.translate = `0 ${distance}px`;
  }

  function endPull() {
    const panel = panelRef.current;
    const wasPulling = startY.current !== null;
    startY.current = null;
    if (!panel || !wasPulling) {
      return;
    }
    panel.style.transition = '';
    panel.style.translate = '';
    if (pulled.current > CLOSE_AFTER_PX) {
      pulled.current = 0;
      onClose();
    }
  }

  /** A press on the grip closes the sheet. The click that ends a pull does not. */
  function closeFromGrip() {
    const wasPulled = pulled.current > 4;
    pulled.current = 0;
    if (!wasPulled) {
      onClose();
    }
  }

  function closeOnEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (isOwnEscape(event)) {
      onClose();
    }
  }

  return (
    <div
      ref={panelRef}
      id={id}
      role='dialog'
      aria-label={label}
      inert={!isOpen}
      onKeyDown={closeOnEscape}
      className={cn(
        'bg-card hairline-ring ring-border absolute inset-x-2 bottom-2 z-10 flex h-[58%] flex-col rounded-2xl px-4 pb-4 shadow-xl shadow-black/8 transition-[translate] duration-300 ease-(--ease-drawer)',
        panelOf(isOpen)
      )}
    >
      <button
        type='button'
        aria-label={`Close ${label}`}
        onClick={closeFromGrip}
        onPointerDown={startPull}
        onPointerMove={pull}
        onPointerUp={endPull}
        onPointerCancel={endPull}
        className='group/grip flex h-7 w-full shrink-0 cursor-grab touch-none items-center justify-center outline-none active:cursor-grabbing'
      >
        <span className='bg-foreground/20 group-focus-visible/grip:bg-primary h-1 w-9 rounded-full' />
      </button>
      {children}
    </div>
  );
}
