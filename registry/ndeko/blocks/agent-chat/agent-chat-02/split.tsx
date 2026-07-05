'use client';

import { useRef } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

export const DEFAULT_SPLIT = 42;

const MIN_SPLIT = 30;

const MAX_SPLIT = 62;

const KEY_STEP = 2;

/** How far the sheet has to be dragged down before letting go closes it. */
const CLOSE_AFTER_PX = 80;

function bounded(percent: number) {
  const atLeast = Math.max(MIN_SPLIT, percent);
  return Math.min(MAX_SPLIT, atLeast);
}

function splitFromKey(key: string, split: number) {
  if (key === 'ArrowLeft') {
    return bounded(split - KEY_STEP);
  }
  if (key === 'ArrowRight') {
    return bounded(split + KEY_STEP);
  }
  if (key === 'Home') {
    return MIN_SPLIT;
  }
  if (key === 'End') {
    return MAX_SPLIT;
  }
  return null;
}

type ResizeHandleProps = {
  split: number;
  /** The element whose `--split` the handle drives. */
  containerRef: React.RefObject<HTMLElement | null>;
  onSplitChange: (split: number) => void;
};

/** While it is dragged the width is written to the container; React hears about it once, on release. */
export function ResizeHandle({
  split,
  containerRef,
  onSplitChange,
}: ResizeHandleProps) {
  const dragged = useRef<number | null>(null);

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragged.current = split;
  }

  function drag(event: React.PointerEvent<HTMLDivElement>) {
    const container = containerRef.current;
    const isDragging = dragged.current !== null;
    if (!container || !isDragging) {
      return;
    }
    const box = container.getBoundingClientRect();
    const offset = event.clientX - box.left;
    const percent = (offset / box.width) * 100;
    const next = bounded(percent);
    dragged.current = next;
    container.style.setProperty('--split', `${next}%`);
  }

  function endDrag() {
    const next = dragged.current;
    dragged.current = null;
    if (next !== null) {
      onSplitChange(Math.round(next));
    }
  }

  function moveWithKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const next = splitFromKey(event.key, split);
    if (next === null) {
      return;
    }
    event.preventDefault();
    onSplitChange(next);
  }

  return (
    <div
      role='separator'
      tabIndex={0}
      aria-orientation='vertical'
      aria-label='Resize the conversation and the artifact'
      aria-valuemin={MIN_SPLIT}
      aria-valuemax={MAX_SPLIT}
      aria-valuenow={split}
      onPointerDown={startDrag}
      onPointerMove={drag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={() => onSplitChange(DEFAULT_SPLIT)}
      onKeyDown={moveWithKeys}
      className='group/handle focus-visible:ring-ring/25 hidden w-3 shrink-0 cursor-col-resize touch-none items-center justify-center rounded-full outline-none focus-visible:ring-[3px] @3xl:flex'
    >
      <span className='bg-foreground/15 group-hover/handle:bg-foreground/35 group-active/handle:bg-primary h-8 w-1 rounded-full transition-colors duration-150' />
    </div>
  );
}

function backdropOf(isOpen: boolean) {
  if (isOpen) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

function panelOf(isOpen: boolean) {
  if (isOpen) {
    return 'translate-y-0';
  }
  return 'translate-y-[calc(100%+1rem)]';
}

function layerOf(isOpen: boolean) {
  if (isOpen) {
    return undefined;
  }
  return 'pointer-events-none';
}

type BottomSheetProps = {
  isOpen: boolean;
  label: string;
  onClose: () => void;
  children: React.ReactNode;
};

/** Drawn inside the block. Its grip follows the finger and closes the sheet when it is pulled far enough. */
export function BottomSheet({
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

  function closeFromGrip() {
    const wasPulled = pulled.current > 4;
    pulled.current = 0;
    if (!wasPulled) {
      onClose();
    }
  }

  function closeOnEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  return (
    <div
      inert={!isOpen}
      onKeyDown={closeOnEscape}
      className={cn('absolute inset-0 z-10 @3xl:hidden', layerOf(isOpen))}
    >
      <div
        aria-hidden='true'
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-black/40 transition-opacity duration-200',
          backdropOf(isOpen)
        )}
      />
      <div
        ref={panelRef}
        role='dialog'
        aria-label={label}
        className={cn(
          'bg-card hairline-ring ring-border absolute inset-x-2 bottom-2 flex h-[78%] flex-col rounded-2xl px-4 pb-4 shadow-xl shadow-black/8 transition-[translate] duration-300 ease-(--ease-drawer)',
          panelOf(isOpen)
        )}
      >
        <button
          type='button'
          aria-label='Close the artifact'
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
    </div>
  );
}
