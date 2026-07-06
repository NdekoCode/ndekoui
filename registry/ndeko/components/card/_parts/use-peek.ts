'use client';

import { useState } from 'react';

/** Whether a pointer rests on an element. A finger does not hover, so touch is left to the press of the piece. */
export function useHover() {
  const [isHovered, setIsHovered] = useState(false);

  function hoverStarts(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'touch') {
      setIsHovered(true);
    }
  }

  function hoverEnds() {
    setIsHovered(false);
  }

  const hoverHandlers = {
    onPointerEnter: hoverStarts,
    onPointerLeave: hoverEnds,
  };

  return { isHovered, hoverHandlers };
}

/**
 * Whether a person looks closer at an element: the pointer rests on it, or the keyboard brought
 * focus to it. A press with a mouse also focuses a button, and that is not a closer look.
 */
export function usePeek() {
  const { isHovered, hoverHandlers } = useHover();
  const [isFocused, setIsFocused] = useState(false);

  function focusEnters(event: React.FocusEvent<HTMLElement>) {
    const isKeyboardFocus = event.target.matches(':focus-visible');
    setIsFocused(isKeyboardFocus);
  }

  function focusLeaves() {
    setIsFocused(false);
  }

  const isPeeking = isHovered || isFocused;
  const peekHandlers = {
    ...hoverHandlers,
    onFocus: focusEnters,
    onBlur: focusLeaves,
  };

  return { isPeeking, peekHandlers };
}
