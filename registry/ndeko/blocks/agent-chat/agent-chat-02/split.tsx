'use client';

import { useRef } from 'react';

export const DEFAULT_SPLIT = 42;

const MIN_SPLIT = 30;

const MAX_SPLIT = 62;

const KEY_STEP = 2;

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
