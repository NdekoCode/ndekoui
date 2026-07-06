'use client';

import { useState } from 'react';

import { clamp, columnIndexAt } from './scale';

type ReadingOptions = {
  /** How many positions the plot has from left to right. */
  count: number;
  /** Where the reading opens the first time the plot takes keyboard focus. */
  defaultIndex: number;
  /** A position shown from outside while nobody reads the plot, for a demonstration. */
  guideIndex?: number | null;
  /** Enter, Space or a click on a position. */
  onSelect?: (index: number) => void;
};

function columnIndexFrom(
  event: React.PointerEvent<HTMLElement> | React.MouseEvent<HTMLElement>,
  count: number
) {
  const box = event.currentTarget.getBoundingClientRect();
  const offset = event.clientX - box.left;
  const ratio = offset / box.width;
  return columnIndexAt(ratio, count);
}

export function steppedIndexOf(key: string, current: number, count: number) {
  const lastIndex = Math.max(count - 1, 0);
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

export function activeIndexOf(isActive: boolean, shownIndex: number) {
  if (isActive) {
    return shownIndex;
  }
  return null;
}

/** A reading is said aloud only while the arrow keys move it: a pointer and a demonstration stay silent. */
export function readingAloud(isReadingByKeys: boolean, reading: string) {
  if (isReadingByKeys) {
    return reading;
  }
  return '';
}

function isSelectKey(key: string) {
  const isEnter = key === 'Enter';
  const isSpace = key === ' ';
  return isEnter || isSpace;
}

/**
 * One reading position for a plot that is one tab stop. The pointer wins while it is over the plot,
 * then the arrow keys, then the position a demonstration points at. A reading that opens appears in
 * place; one that moves glides, which `isGliding` tells the readout.
 *
 * A plot read by columns spreads `handlers`. A plot whose marks are their own hit targets spreads
 * `markHandlers` and calls `pointTo` from each mark.
 */
export function useReading({
  count,
  defaultIndex,
  guideIndex = null,
  onSelect,
}: ReadingOptions) {
  const [pointerIndex, setPointerIndex] = useState<number | null>(null);
  const [keyIndex, setKeyIndex] = useState<number | null>(null);
  const [lastIndex, setLastIndex] = useState(defaultIndex);
  const [isGliding, setIsGliding] = useState(false);
  const [seenGuide, setSeenGuide] = useState(guideIndex);
  const hasNewGuide = seenGuide !== guideIndex;

  if (hasNewGuide) {
    const wasGuided = seenGuide !== null;
    const isGuided = guideIndex !== null;
    setSeenGuide(guideIndex);
    setIsGliding(wasGuided && isGuided);
    if (guideIndex !== null) {
      setLastIndex(guideIndex);
    }
  }

  const activeIndex = pointerIndex ?? keyIndex ?? guideIndex;
  const isActive = activeIndex !== null;
  const isPointing = pointerIndex !== null;
  const isReadingByKeys = keyIndex !== null;
  const wantedIndex = activeIndex ?? lastIndex;
  const highestIndex = Math.max(count - 1, 0);
  const shownIndex = clamp(wantedIndex, 0, highestIndex);

  function pointAt(event: React.PointerEvent<HTMLElement>) {
    const index = columnIndexFrom(event, count);
    setIsGliding(isPointing);
    setPointerIndex(index);
    setLastIndex(index);
  }

  /** Null when the pointer is over the plot and on no mark. */
  function pointTo(index: number | null) {
    if (index === null) {
      setPointerIndex(null);
      return;
    }
    setIsGliding(isPointing);
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
      setIsGliding(false);
      setKeyIndex(shownIndex);
    }
  }

  function blur() {
    setKeyIndex(null);
    setPointerIndex(null);
  }

  function pressKey(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      setKeyIndex(null);
      return;
    }
    if (isSelectKey(event.key)) {
      if (onSelect) {
        event.preventDefault();
        setKeyIndex(shownIndex);
        onSelect(shownIndex);
      }
      return;
    }
    const next = steppedIndexOf(event.key, shownIndex, count);
    if (next === null) {
      return;
    }
    event.preventDefault();
    setIsGliding(isActive);
    setPointerIndex(null);
    setKeyIndex(next);
    setLastIndex(next);
  }

  function click(event: React.MouseEvent<HTMLElement>) {
    if (!onSelect) {
      return;
    }
    const index = columnIndexFrom(event, count);
    onSelect(index);
  }

  const handlers = {
    onPointerMove: pointAt,
    onPointerDown: pointAt,
    onPointerLeave: leave,
    onFocus: focus,
    onBlur: blur,
    onKeyDown: pressKey,
    onClick: click,
  };

  const markHandlers = {
    onPointerLeave: leave,
    onFocus: focus,
    onBlur: blur,
    onKeyDown: pressKey,
  };

  return {
    shownIndex,
    isActive,
    isGliding,
    isPointing,
    isReadingByKeys,
    handlers,
    markHandlers,
    pointTo,
  };
}
