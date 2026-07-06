'use client';

import { useRef, useState } from 'react';

const DRAG_THRESHOLD_PX = 4;

type Press = {
  pointerId: number;
  startX: number;
  startScroll: number;
};

/** A mouse drags a row that touch already swipes: the row follows the pointer, then lets the snap points settle it. */
export function useDragScroll<Element extends HTMLElement>() {
  const ref = useRef<Element>(null);
  const press = useRef<Press | null>(null);
  const hasDragged = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  function startPress(event: React.PointerEvent<Element>) {
    const isMouse = event.pointerType === 'mouse';
    const isMainButton = event.button === 0;
    if (!isMouse || !isMainButton) {
      return;
    }
    const scroller = ref.current;
    if (!scroller) {
      return;
    }
    hasDragged.current = false;
    press.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: scroller.scrollLeft,
    };
  }

  function movePress(event: React.PointerEvent<Element>) {
    const current = press.current;
    const scroller = ref.current;
    if (!current || !scroller) {
      return;
    }
    const isStale = event.buttons === 0;
    if (isStale) {
      press.current = null;
      setIsDragging(false);
      return;
    }
    const travel = event.clientX - current.startX;
    const hasStarted = hasDragged.current;
    const isPastThreshold = Math.abs(travel) > DRAG_THRESHOLD_PX;
    if (!hasStarted && !isPastThreshold) {
      return;
    }
    if (!hasStarted) {
      hasDragged.current = true;
      setIsDragging(true);
      scroller.setPointerCapture(current.pointerId);
    }
    scroller.scrollTo({
      left: current.startScroll - travel,
      behavior: 'instant',
    });
  }

  function endPress(event: React.PointerEvent<Element>) {
    const current = press.current;
    const scroller = ref.current;
    press.current = null;
    if (!current || !scroller) {
      return;
    }
    const isCaptured = scroller.hasPointerCapture(event.pointerId);
    if (isCaptured) {
      scroller.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
  }

  function swallowClickAfterDrag(event: React.MouseEvent<Element>) {
    if (!hasDragged.current) {
      return;
    }
    hasDragged.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  return {
    ref,
    isDragging,
    handlers: {
      onPointerDown: startPress,
      onPointerMove: movePress,
      onPointerUp: endPress,
      onPointerCancel: endPress,
      onClickCapture: swallowClickAfterDrag,
    },
  };
}
