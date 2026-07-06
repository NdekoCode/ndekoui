'use client';

import { useState } from 'react';

import { clamp } from './chart-math';
import { rovingTargetOf } from './roving';

/** A line has a point at each edge of its plot; bars have a column each, so a pointer lands on the column under it. */
export type ReadingMode = 'point' | 'column';

function indexAtOf(ratio: number, count: number, mode: ReadingMode) {
  const lastIndex = count - 1;
  if (mode === 'point') {
    return clamp(Math.round(ratio * lastIndex), 0, lastIndex);
  }
  return clamp(Math.floor(ratio * count), 0, lastIndex);
}

/**
 * What a plot reads out: the position under the pointer or the one the arrow keys reached, and the
 * last position when nobody reads. The plot is the one tab stop of its chart.
 */
export function useReading(count: number, mode: ReadingMode) {
  const [reading, setReading] = useState<number | null>(null);
  const lastIndex = Math.max(count - 1, 0);
  const shownIndex = Math.min(reading ?? lastIndex, lastIndex);
  const isReading = reading !== null;

  function readFromPointer(event: React.PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    setReading(indexAtOf(ratio, count, mode));
  }

  function readFromKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      setReading(null);
      return;
    }
    const next = rovingTargetOf(event.key, shownIndex, count);
    if (next === null) {
      return;
    }
    event.preventDefault();
    setReading(next);
  }

  function stopReading() {
    setReading(null);
  }

  return {
    shownIndex,
    isReading,
    handlers: {
      onPointerMove: readFromPointer,
      onPointerLeave: stopReading,
      onKeyDown: readFromKeys,
      onBlur: stopReading,
    },
  };
}
