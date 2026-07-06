'use client';

import { useRef, useState } from 'react';

import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';

import { clamp, lerp, positionsTo } from './scale';

/** `columns` share the track equally and the handle sits in the middle of one; `edges` are the lines between columns, both ends included. */
type Placement = 'columns' | 'edges';

type StepDragOptions = {
  /** How many positions the handle can rest on. */
  count: number;
  index: number;
  onIndexChange: (index: number) => void;
  placement?: Placement;
};

type Sample = {
  time: number;
  position: number;
};

/** After the hand lets go, the handle travels as far as its speed would carry it in this time. */
const MOMENTUM_MS = 140;

/** A hand that stopped this long before letting go carries nothing. */
const STILL_AFTER_MS = 90;

const FIRST_COAST_MS = 36;

/** Each position of a coast takes this much longer than the one before, so the handle slows to a stop. */
const COAST_SLOWDOWN = 1.28;

const PAGE_STEP = 3;

/** How much of the newest reading of the speed is kept: one sample alone is too jumpy. */
const SPEED_SMOOTHING = 0.6;

function positionFrom(
  event: React.PointerEvent<HTMLElement>,
  count: number,
  placement: Placement
) {
  const box = event.currentTarget.getBoundingClientRect();
  const offset = event.clientX - box.left;
  const ratio = offset / box.width;
  if (placement === 'edges') {
    const lastEdge = count - 1;
    return ratio * lastEdge;
  }
  const column = ratio * count;
  return column - 0.5;
}

function keyTargetOf(key: string, index: number, lastIndex: number) {
  const isForward = key === 'ArrowRight' || key === 'ArrowUp';
  const isBackward = key === 'ArrowLeft' || key === 'ArrowDown';
  if (isForward) {
    return index + 1;
  }
  if (isBackward) {
    return index - 1;
  }
  if (key === 'PageUp') {
    return index + PAGE_STEP;
  }
  if (key === 'PageDown') {
    return index - PAGE_STEP;
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
 * A handle that moves from one position to the next under a hand: it catches on each position, it
 * keeps going for a moment when it is flicked, and the arrow keys move it one position at a time.
 * Spread `sliderProps` on the track, which is the one tab stop.
 */
export function useStepDrag({
  count,
  index,
  onIndexChange,
  placement = 'columns',
}: StepDragOptions) {
  const { schedule, clearAll } = useTimeouts();
  const [isDragging, setIsDragging] = useState(false);
  const lastSample = useRef<Sample | null>(null);
  const speed = useRef(0);
  const lastIndex = Math.max(count - 1, 0);

  function indexAt(position: number) {
    const nearest = Math.round(position);
    return clamp(nearest, 0, lastIndex);
  }

  function moveTo(next: number) {
    if (next !== index) {
      onIndexChange(next);
    }
  }

  /** Goes to a position through every one on the way, each a little later than the last. */
  function coastTo(target: number) {
    clearAll();
    const end = clamp(target, 0, lastIndex);
    const stops = positionsTo(index, end);
    let delay = 0;
    let pace = FIRST_COAST_MS;
    for (const stop of stops) {
      delay += pace;
      pace *= COAST_SLOWDOWN;
      schedule(() => onIndexChange(stop), delay);
    }
  }

  function startDrag(event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }
    clearAll();
    event.currentTarget.setPointerCapture(event.pointerId);
    const position = positionFrom(event, count, placement);
    lastSample.current = { time: event.timeStamp, position };
    speed.current = 0;
    setIsDragging(true);
    const next = indexAt(position);
    moveTo(next);
  }

  function drag(event: React.PointerEvent<HTMLElement>) {
    const previous = lastSample.current;
    if (!previous) {
      return;
    }
    const position = positionFrom(event, count, placement);
    const elapsed = event.timeStamp - previous.time;
    if (elapsed > 0) {
      const moved = position - previous.position;
      const latest = moved / elapsed;
      speed.current = lerp(speed.current, latest, SPEED_SMOOTHING);
    }
    lastSample.current = { time: event.timeStamp, position };
    const next = indexAt(position);
    moveTo(next);
  }

  function endDrag(event: React.PointerEvent<HTMLElement>) {
    const previous = lastSample.current;
    if (!previous) {
      return;
    }
    lastSample.current = null;
    setIsDragging(false);
    const stillFor = event.timeStamp - previous.time;
    if (stillFor > STILL_AFTER_MS) {
      return;
    }
    const carried = Math.round(speed.current * MOMENTUM_MS);
    if (carried !== 0) {
      coastTo(index + carried);
    }
  }

  function cancelDrag() {
    lastSample.current = null;
    setIsDragging(false);
  }

  function pressKey(event: React.KeyboardEvent<HTMLElement>) {
    const target = keyTargetOf(event.key, index, lastIndex);
    if (target === null) {
      return;
    }
    event.preventDefault();
    clearAll();
    const next = clamp(target, 0, lastIndex);
    moveTo(next);
  }

  const sliderProps = {
    onPointerDown: startDrag,
    onPointerMove: drag,
    onPointerUp: endDrag,
    onPointerCancel: cancelDrag,
    onKeyDown: pressKey,
  };

  return { isDragging, flickTo: coastTo, sliderProps };
}
