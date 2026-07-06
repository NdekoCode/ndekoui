'use client';

import { useState } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

const NICE_FACTORS = [1, 2, 5, 10];

export function niceScale(maxValue: number, maxLines: number) {
  const safeMax = Math.max(maxValue, 1);
  const roughStep = safeMax / maxLines;
  const logarithm = Math.log10(roughStep);
  const exponent = Math.floor(logarithm);
  const magnitude = 10 ** exponent;
  const factor = NICE_FACTORS.find((candidate) => {
    const candidateStep = candidate * magnitude;
    return candidateStep >= roughStep;
  });
  const safeFactor = factor ?? 10;
  const step = safeFactor * magnitude;
  const lineCount = Math.ceil(safeMax / step);
  const top = lineCount * step;
  const tickCount = lineCount + 1;
  const ticks = Array.from({ length: tickCount }, (_, index) => {
    return index * step;
  });
  return { top, ticks };
}

export function columnCenterOf(index: number, count: number) {
  const center = index + 0.5;
  return center / count;
}

export function percentOf(share: number) {
  const percent = share * 100;
  return `${percent}%`;
}

function columnIndexAt(event: React.PointerEvent<HTMLElement>, count: number) {
  const box = event.currentTarget.getBoundingClientRect();
  const offset = event.clientX - box.left;
  const share = offset / box.width;
  const rawIndex = Math.floor(share * count);
  const lastIndex = count - 1;
  const clampedHigh = Math.min(rawIndex, lastIndex);
  return Math.max(clampedHigh, 0);
}

function steppedIndexOf(key: string, current: number, count: number) {
  const lastIndex = count - 1;
  if (key === 'ArrowRight') {
    const next = current + 1;
    return Math.min(next, lastIndex);
  }
  if (key === 'ArrowLeft') {
    const previous = current - 1;
    return Math.max(previous, 0);
  }
  if (key === 'Home') {
    return 0;
  }
  if (key === 'End') {
    return lastIndex;
  }
  return null;
}

/**
 * One reading position for a chart: the pointer column wins while it is over the plot,
 * the arrow keys move it while the plot has keyboard focus.
 */
export function useActiveIndex(count: number, defaultIndex: number) {
  const [pointerIndex, setPointerIndex] = useState<number | null>(null);
  const [keyIndex, setKeyIndex] = useState<number | null>(null);
  const [lastIndex, setLastIndex] = useState(defaultIndex);
  const activeIndex = pointerIndex ?? keyIndex;
  const isActive = activeIndex !== null;
  const isReadingByKeys = keyIndex !== null;
  const wantedIndex = activeIndex ?? lastIndex;
  const lastColumn = count - 1;
  const highestIndex = Math.max(lastColumn, 0);
  const shownIndex = Math.min(wantedIndex, highestIndex);

  function pointAt(event: React.PointerEvent<HTMLElement>) {
    const index = columnIndexAt(event, count);
    setPointerIndex(index);
    setLastIndex(index);
  }

  function leave(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === 'mouse') {
      setPointerIndex(null);
    }
  }

  function focus(event: React.FocusEvent<HTMLElement>) {
    const isKeyboardFocus = event.currentTarget.matches(':focus-visible');
    if (isKeyboardFocus) {
      setKeyIndex(lastIndex);
    }
  }

  function blur() {
    setKeyIndex(null);
    setPointerIndex(null);
  }

  function step(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      setKeyIndex(null);
      return;
    }
    const current = keyIndex ?? lastIndex;
    const next = steppedIndexOf(event.key, current, count);
    if (next === null) {
      return;
    }
    event.preventDefault();
    setPointerIndex(null);
    setKeyIndex(next);
    setLastIndex(next);
  }

  const handlers = {
    onPointerMove: pointAt,
    onPointerDown: pointAt,
    onPointerLeave: leave,
    onFocus: focus,
    onBlur: blur,
    onKeyDown: step,
  };

  return { shownIndex, isActive, isReadingByKeys, handlers };
}

type BubbleAlign = 'start' | 'center' | 'end';

const BUBBLE_ALIGN: Record<BubbleAlign, string> = {
  start: '-translate-x-3',
  center: '-translate-x-1/2',
  end: '-translate-x-[calc(100%-0.75rem)]',
};

/** A point in the first or last third of the plot keeps its bubble inside the plot on a phone. */
const START_SHARE = 1 / 3;
const END_SHARE = 2 / 3;

export function bubbleAlignOf(index: number, count: number): BubbleAlign {
  const lastIndex = Math.max(count - 1, 1);
  const share = index / lastIndex;
  if (share < START_SHARE) {
    return 'start';
  }
  if (share > END_SHARE) {
    return 'end';
  }
  return 'center';
}

type ChartBubbleProps = {
  left: string;
  top: number;
  align: BubbleAlign;
  isVisible: boolean;
  children: React.ReactNode;
};

/** The one value bubble of a chart. It stays mounted so it can fade out where it was. */
export function ChartBubble({
  left,
  top,
  align,
  isVisible,
  children,
}: ChartBubbleProps) {
  const position = { left, top };

  return (
    <div
      aria-hidden='true'
      className='pointer-events-none absolute z-10 w-0'
      style={position}
    >
      <div
        className={cn(
          'surface-raised flex w-max -translate-y-full flex-col gap-0.5 rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap',
          'origin-bottom transition-[opacity,scale] duration-[125ms] ease-(--ease-out-strong)',
          BUBBLE_ALIGN[align],
          !isVisible && 'scale-[0.97] opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  );
}
